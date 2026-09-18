import base64
from decimal import Decimal
from datetime import timedelta
from pathlib import Path
import shutil

from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import (
    ActivityLog,
    AMCType,
    CalendarEvent,
    Campaign,
    Complaint,
    ComplaintDepartment,
    Customer,
    Contact,
    CreditNote,
    CustomerGroup,
    DatabaseBackup,
    Enquiry,
    Expense,
    ExpenseCategory,
    Item,
    ItemGroup,
    JobActivity,
    GSTInvoice,
    LeadHotnessLevel,
    Lead,
    LeadSource,
    LeadStatus,
    JobActivityChecklist,
    JobActivityTemplate,
    Staff,
    StaffDesignation,
    TaxRate,
    Currency,
    PaymentMode,
    Unit,
    Todo,
    Goal,
    ReferralPartner,
    Vendor,
    Project,
    PurchaseInvoice,
    PurchaseOrder,
    Quotation,
    ProformaInvoice,
    Payment,
    AdvancePayment,
    AMCContract,
)
from .backup import decrypt_backup, encrypt_backup


class CrmApiTestCase(TestCase):
    """Focused API coverage for authentication and the most sensitive endpoints."""

    backup_root = Path(__file__).resolve().parent.parent / "test_backups"

    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.admin_user = User.objects.create_user(
            username="admin-test@example.test",
            email="admin-test@example.test",
            password="test-password-admin",
            is_staff=True,
        )
        cls.normal_user = User.objects.create_user(
            username="staff-test@example.test",
            email="staff-test@example.test",
            password="test-password-staff",
        )
        cls.admin_staff = Staff.objects.create(
            user=cls.admin_user,
            name="Test Administrator",
            first_name="Test",
            last_name="Administrator",
            email=cls.admin_user.email,
            is_administrator=True,
        )
        cls.normal_staff = Staff.objects.create(
            user=cls.normal_user,
            name="Test Staff",
            first_name="Test",
            last_name="Staff",
            email=cls.normal_user.email,
        )

    def setUp(self):
        self.anonymous_client = APIClient()
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(self.admin_user)
        self.staff_client = APIClient()
        self.staff_client.force_authenticate(self.normal_user)

    def tearDown(self):
        if self.backup_root.exists():
            shutil.rmtree(self.backup_root)

    def test_login_sets_access_and_refresh_cookies(self):
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"email": self.admin_user.email, "password": "test-password-admin"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["authenticated"])
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)
        self.assertIn("csrftoken", response.cookies)

    def test_login_ignores_stale_access_cookie(self):
        client = APIClient()
        client.cookies["access_token"] = "expired-or-invalid"
        response = client.post(
            "/api/auth/login/",
            {"email": self.admin_user.email, "password": "test-password-admin"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["authenticated"])

    def test_refresh_uses_refresh_cookie_and_issues_access_cookie(self):
        client = APIClient()
        login = client.post(
            "/api/auth/login/",
            {"email": self.admin_user.email, "password": "test-password-admin"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)

        client.cookies.pop("access_token", None)
        response = client.post("/api/auth/refresh/", {}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["authenticated"])
        self.assertIn("access_token", response.cookies)

    def test_anonymous_requests_are_rejected(self):
        for path in (
            "/api/customers/",
            "/api/staff/",
            "/api/customer-groups/",
            "/api/activity-logs/",
            "/api/job-activity-checklists/",
            "/api/database-backups/",
        ):
            with self.subTest(path=path):
                self.assertIn(self.anonymous_client.get(path).status_code, (401, 403))

    def test_administrator_only_endpoints_reject_normal_staff(self):
        protected_paths = (
            "/api/staff/",
            "/api/customer-groups/",
            "/api/activity-logs/",
            "/api/job-activity-checklists/",
            "/api/database-backups/",
        )
        for path in protected_paths:
            with self.subTest(path=path):
                self.assertEqual(self.staff_client.get(path).status_code, 403)
                self.assertIn(self.admin_client.get(path).status_code, (200, 204))

    def test_setup_and_job_activity_checklist_are_administrator_only(self):
        setup = self.admin_client.post(
            "/api/customer-groups/",
            {"name": "Isolated Test Group", "description": "Only test data"},
            format="json",
        )
        self.assertEqual(setup.status_code, 201)
        self.assertEqual(
            self.staff_client.post(
                "/api/customer-groups/",
                {"name": "Unauthorized Group"},
                format="json",
            ).status_code,
            403,
        )

        template = JobActivityTemplate.objects.create(name="Isolated Test Template")
        checklist = self.admin_client.post(
            "/api/job-activity-checklists/",
            {"template": template.pk, "name": "Verify camera", "is_required": True},
            format="json",
        )
        self.assertEqual(checklist.status_code, 201)
        self.assertTrue(
            JobActivityChecklist.objects.filter(pk=checklist.data["id"]).exists()
        )

    def test_activity_logs_are_read_only_and_administrator_only(self):
        log = ActivityLog.objects.create(description="Isolated test event", staff="Test Staff")

        self.assertEqual(self.admin_client.get("/api/activity-logs/").status_code, 200)
        self.assertEqual(
            self.staff_client.get(f"/api/activity-logs/{log.pk}/").status_code, 403
        )
        self.assertEqual(
            self.admin_client.post(
                "/api/activity-logs/",
                {"description": "Should not be writable"},
                format="json",
            ).status_code,
            405,
        )

    def test_database_backup_is_administrator_only(self):
        self.assertEqual(self.staff_client.get("/api/database-backups/").status_code, 403)

        response = self.admin_client.post("/api/database-backups/", {}, format="json")

        self.assertEqual(response.status_code, 201)
        backup = DatabaseBackup.objects.get(pk=response.data["id"])
        self.assertGreater(backup.size, 0)
        self.assertEqual(
            self.staff_client.delete(f"/api/database-backups/{backup.pk}/").status_code,
            403,
        )

    def test_customer_crud_is_available_to_authenticated_staff(self):
        create = self.staff_client.post(
            "/api/customers/",
            {
                "name": "Isolated Test Customer",
                "company": "Test Company",
                "email": "customer-test@example.test",
                "phone": "0000000000",
                "city": "Test City",
            },
            format="json",
        )
        self.assertEqual(create.status_code, 201)
        customer_id = create.data["id"]
        self.assertEqual(Customer.objects.get(pk=customer_id).name, "Isolated Test Customer")

        self.assertEqual(self.staff_client.get(f"/api/customers/{customer_id}/").status_code, 200)
        update = self.staff_client.patch(
            f"/api/customers/{customer_id}/",
            {"name": "Updated Test Customer"},
            format="json",
        )
        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.data["name"], "Updated Test Customer")
        self.assertEqual(self.staff_client.delete(f"/api/customers/{customer_id}/").status_code, 204)
        self.assertFalse(Customer.objects.filter(pk=customer_id).exists())

    def test_expense_crud_and_attachment_upload(self):
        category = ExpenseCategory.objects.create(name="Test Expense Category")
        invalid = self.staff_client.post(
            "/api/expenses/",
            {"name": "Invalid expense", "expense_date": "2026-09-18", "amount": "10.00"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)

        attachment = SimpleUploadedFile("receipt.txt", b"receipt", content_type="text/plain")
        created = self.staff_client.post(
            "/api/expenses/",
            {
                "name": "Uploaded expense",
                "category": category.pk,
                "expense_date": "2026-09-18",
                "amount": "10.00",
                "payment_mode": "Cash",
                "attachment": attachment,
            },
            format="multipart",
        )
        self.assertEqual(created.status_code, 201)
        expense_id = created.data["id"]
        expense = Expense.objects.get(pk=expense_id)
        self.assertTrue(expense.attachment.storage.exists(expense.attachment.name))

        updated = self.staff_client.patch(
            f"/api/expenses/{expense_id}/",
            {"name": "Updated uploaded expense"},
            format="json",
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["name"], "Updated uploaded expense")
        self.assertEqual(self.staff_client.delete(f"/api/expenses/{expense_id}/").status_code, 204)
        self.assertFalse(Expense.objects.filter(pk=expense_id).exists())

    @override_settings(BACKUP_ENCRYPTION_KEY="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    def test_backup_encryption_round_trip(self):
        original = b"isolated backup payload"
        encrypted = encrypt_backup(original)
        self.assertNotEqual(encrypted, original)
        self.assertEqual(decrypt_backup(encrypted), original)

    @override_settings(
        BACKUP_ENCRYPTION_KEY="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        BACKUP_UPLOAD_HOOK="",
    )
    def test_required_offsite_upload_blocks_backup(self):
        with self.assertRaises(CommandError):
            call_command("backup_database", encrypt=True, require_upload=True, verbosity=0)
        self.assertEqual(DatabaseBackup.objects.count(), 0)

    @override_settings(
        BACKUP_ENCRYPTION_KEY="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        BACKUP_UPLOAD_HOOK="crm.tests.successful_upload",
    )
    def test_required_offsite_upload_requires_success_confirmation(self):
        with self.assertRaises(CommandError):
            call_command("backup_database", encrypt=True, require_upload=True, verbosity=0)
        self.assertEqual(DatabaseBackup.objects.count(), 0)

    def test_logout_clears_authentication_cookies(self):
        response = self.admin_client.post("/api/auth/logout/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.cookies["access_token"]["max-age"], 0)
        self.assertEqual(response.cookies["refresh_token"]["max-age"], 0)


class IndependentSetupApiTests(CrmApiTestCase):
    """CRUD, authorization, validation, and search coverage for setup modules."""

    setup_endpoints = (
        ("customer-groups", CustomerGroup, {"name": "CCTV Customers"}),
        ("staff-designations", StaffDesignation, {"name": "Field Engineer"}),
        ("complaint-departments", ComplaintDepartment, {"name": "Technical Support"}),
        ("lead-sources", LeadSource, {"name": "Website"}),
        ("lead-statuses", LeadStatus, {"name": "Qualified", "position": 1}),
        ("lead-hotness-levels", LeadHotnessLevel, {"name": "Very Hot", "score": 10}),
        ("campaigns", Campaign, {"name": "September Campaign", "code": "SEP-TEST"}),
        ("tax-rates", TaxRate, {"name": "GST 18", "rate": "18.00"}),
        ("currencies", Currency, {"name": "Indian Rupee", "code": "INR-TEST", "symbol": "₹"}),
        ("payment-modes", PaymentMode, {"name": "Bank Transfer"}),
        ("units", Unit, {"name": "Piece", "abbreviation": "pc"}),
        ("amc-types", AMCType, {"name": "Annual Service", "default_value": "1000.00"}),
    )

    def test_setup_modules_are_isolated_crud_searchable_and_admin_only(self):
        for endpoint, model, payload in self.setup_endpoints:
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.staff_client.get(f"/api/{endpoint}/").status_code, 403)
                self.assertEqual(
                    self.admin_client.post(f"/api/{endpoint}/", {}, format="json").status_code,
                    400,
                )
                created = self.admin_client.post(
                    f"/api/{endpoint}/", payload, format="json"
                )
                self.assertEqual(created.status_code, 201, created.data)
                object_id = created.data["id"]
                self.assertEqual(model.objects.filter(pk=object_id).count(), 1)
                listing = self.admin_client.get(
                    f"/api/{endpoint}/?search={payload['name'].replace(' ', '%20')}"
                )
                self.assertEqual(listing.status_code, 200)
                self.assertTrue(any(row["id"] == object_id for row in listing.data))
                self.assertEqual(
                    self.admin_client.get(f"/api/{endpoint}/{object_id}/").status_code, 200
                )
                updated = self.admin_client.patch(
                    f"/api/{endpoint}/{object_id}/",
                    {"description": "Updated in isolated API test"},
                    format="json",
                )
                self.assertEqual(updated.status_code, 200)
                self.assertEqual(updated.data["description"], "Updated in isolated API test")
                self.assertEqual(
                    self.admin_client.delete(f"/api/{endpoint}/{object_id}/").status_code,
                    204,
                )
                self.assertFalse(model.objects.filter(pk=object_id).exists())


class IndependentCrudApiTests(CrmApiTestCase):
    """CRUD and practical filtering coverage for independent operational modules."""

    def _assert_crud(self, endpoint, payload, model, filter_query=None):
        created = self.staff_client.post(f"/api/{endpoint}/", payload, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        object_id = created.data["id"]
        self.assertEqual(self.staff_client.get(f"/api/{endpoint}/").status_code, 200)
        self.assertEqual(
            self.staff_client.get(f"/api/{endpoint}/{object_id}/").status_code, 200
        )
        if filter_query:
            filtered = self.staff_client.get(f"/api/{endpoint}/?{filter_query}")
            self.assertEqual(filtered.status_code, 200)
            self.assertTrue(any(row["id"] == object_id for row in filtered.data))
        patch_field = next(
            field for field in ("description", "name", "subject", "title", "company")
            if field in payload
        )
        updated = self.staff_client.patch(
            f"/api/{endpoint}/{object_id}/", {patch_field: "Patched"}, format="json"
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data[patch_field], "Patched")
        self.assertEqual(self.staff_client.delete(f"/api/{endpoint}/{object_id}/").status_code, 204)
        self.assertFalse(model.objects.filter(pk=object_id).exists())

    def test_referral_partners_vendors_leads_and_complaints(self):
        self._assert_crud(
            "referral-partners",
            {"name": "Local Installer", "company": "Installer Co", "city": "Pune"},
            ReferralPartner,
            "search=Installer",
        )
        self._assert_crud(
            "vendors",
            {"company": "Camera Supplier", "email": "vendor@example.test", "city": "Pune"},
            Vendor,
            "search=Supplier",
        )
        self._assert_crud(
            "leads",
            {"name": "New CCTV Lead", "email": "lead@example.test", "status": "new", "hotness": "hot"},
            Lead,
            "status=new",
        )
        self._assert_crud(
            "complaints",
            {"subject": "Camera offline", "priority": "high", "status": "open"},
            Complaint,
            "priority=high",
        )

    def test_calendar_todos_goals_and_job_activities(self):
        self._assert_crud(
            "calendar-events",
            {"title": "Site visit", "start_at": "2026-09-18T10:00:00Z", "event_type": "visit"},
            CalendarEvent,
            "event_type=visit",
        )
        self._assert_crud(
            "todos",
            {"title": "Call customer", "due_date": "2026-09-20", "completed": False},
            Todo,
            "completed=false",
        )
        self._assert_crud(
            "goals",
            {"subject": "Monthly sales", "goal_type": "sales", "start_date": "2026-09-01"},
            Goal,
        )
        self._assert_crud(
            "job-activities",
            {"title": "Install DVR", "activity_type": "installation", "priority": "high"},
            JobActivity,
            "activity_type=installation",
        )

    def test_item_and_expense_modules_validate_required_relations(self):
        group = self.staff_client.post(
            "/api/item-groups/", {"name": "Cameras"}, format="json"
        )
        self.assertEqual(group.status_code, 201)
        self._assert_crud(
            "items",
            {"name": "4MP Dome Camera", "group": group.data["id"], "selling_rate": "2500.00"},
            Item,
            f"group={group.data['id']}",
        )
        self._assert_crud(
            "item-groups",
            {"name": "Accessories"},
            ItemGroup,
            "search=Accessories",
        )
        self._assert_crud(
            "expense-categories",
            {"name": "Travel"},
            ExpenseCategory,
            "search=Travel",
        )


class RelationshipCrudApiTests(CrmApiTestCase):
    """CRUD and workflow coverage using explicitly created test dependencies."""

    def setUp(self):
        super().setUp()
        self.customer = Customer.objects.create(name="Relationship Test Customer")
        self.vendor = Vendor.objects.create(company="Relationship Test Vendor")
        self.lead = Lead.objects.create(name="Relationship Test Lead", phone="0000000001")
        self.enquiry = Enquiry.objects.create(title="Relationship Test Enquiry", customer=self.customer, lead=self.lead)

    def _crud(self, endpoint, payload, model, update_field, update_value):
        created = self.staff_client.post(f"/api/{endpoint}/", payload, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        object_id = created.data["id"]
        self.assertEqual(self.staff_client.get(f"/api/{endpoint}/").status_code, 200)
        self.assertEqual(self.staff_client.get(f"/api/{endpoint}/{object_id}/").status_code, 200)
        updated = self.staff_client.patch(
            f"/api/{endpoint}/{object_id}/", {update_field: update_value}, format="json"
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(self.staff_client.delete(f"/api/{endpoint}/{object_id}/").status_code, 204)
        self.assertFalse(model.objects.filter(pk=object_id).exists())
        return created.data

    def test_projects_enquiries_contacts_and_amc_contracts(self):
        project_response = self.staff_client.post(
            "/api/projects/",
            {
                "number": "REL-PROJ-001",
                "name": "Relationship Project",
                "customer": self.customer.pk,
                "start_date": "2026-09-18",
            },
            format="json",
        )
        self.assertEqual(project_response.status_code, 201, project_response.data)
        project = Project.objects.get(pk=project_response.data["id"])
        self.assertEqual(self.staff_client.get(f"/api/projects/{project.pk}/").status_code, 200)
        self.assertEqual(
            self.staff_client.patch(
                f"/api/projects/{project.pk}/", {"name": "Updated Relationship Project"}, format="json"
            ).status_code,
            200,
        )
        self._crud(
            "enquiries",
            {"title": "Relationship Enquiry", "customer": self.customer.pk, "lead": self.lead.pk},
            Enquiry,
            "title",
            "Updated Relationship Enquiry",
        )
        self._crud(
            "contacts",
            {"customer": self.customer.pk, "first_name": "Relationship", "last_name": "Contact"},
            Contact,
            "first_name",
            "Updated",
        )
        self._crud(
            "amc-contracts",
            {
                "customer": self.customer.pk,
                "project": project.pk,
                "subject": "Relationship AMC",
                "start_date": "2026-09-18",
            },
            AMCContract,
            "subject",
            "Updated Relationship AMC",
        )

    def test_purchase_and_finance_workflow_chain(self):
        order_response = self.staff_client.post(
            "/api/purchase-orders/",
            {
                "number": "REL-PO-001",
                "vendor": self.vendor.pk,
                "purchase_order_date": "2026-09-18",
                "items": [{"product": "Camera", "quantity": "2", "rate": "100.00"}],
            },
            format="json",
        )
        self.assertEqual(order_response.status_code, 201, order_response.data)
        order = PurchaseOrder.objects.get(pk=order_response.data["id"])
        self.assertEqual(self.staff_client.get(f"/api/purchase-orders/{order.pk}/").status_code, 200)
        self.assertEqual(
            self.staff_client.patch(
                f"/api/purchase-orders/{order.pk}/", {"reference": "Updated PO"}, format="json"
            ).status_code,
            200,
        )
        self._crud(
            "purchase-invoices",
            {
                "number": "REL-PI-001",
                "vendor": self.vendor.pk,
                "purchase_order": order.pk,
                "invoice_date": "2026-09-18",
                "items": [{"product": "Camera", "quantity": "2", "rate": "100.00"}],
            },
            PurchaseInvoice,
            "reference",
            "Updated PI",
        )
        quotation = self._crud(
            "quotations",
            {
                "number": "REL-Q-001",
                "title": "Relationship Quotation",
                "customer": self.customer.pk,
                "enquiry": self.enquiry.pk,
                "items": [{"item": "Camera", "quantity": "2", "rate": "100.00"}],
            },
            Quotation,
            "title",
            "Updated Relationship Quotation",
        )
        quotation = Quotation.objects.create(
            number="REL-Q-WORKFLOW",
            title="Workflow Quotation",
            customer=self.customer,
            enquiry=self.enquiry,
        )
        proforma_response = self.staff_client.post(
            f"/api/quotations/{quotation.pk}/create_proforma/", {}, format="json"
        )
        self.assertEqual(proforma_response.status_code, 201, proforma_response.data)
        proforma_id = proforma_response.data["id"]
        gst_response = self.staff_client.post(
            f"/api/proforma-invoices/{proforma_id}/create_gst_invoice/", {}, format="json"
        )
        self.assertEqual(gst_response.status_code, 201, gst_response.data)
        gst_id = gst_response.data["id"]
        payment = self._crud(
            "payments",
            {"invoice": gst_id, "amount": "25.00", "payment_method": "cash"},
            Payment,
            "reference",
            "Updated Payment",
        )
        self.assertIsNotNone(payment["id"])
        self._crud(
            "advance-payments",
            {
                "customer": self.customer.pk,
                "amount": "50.00",
                "payment_date": "2026-09-18",
                "payment_method": "cash",
            },
            AdvancePayment,
            "reference",
            "Updated Advance",
        )
        self._crud(
            "credit-notes",
            {"number": "REL-CN-001", "customer": self.customer.pk},
            CreditNote,
            "reference",
            "Updated Credit Note",
        )


class RemainingApplicationVerificationTests(CrmApiTestCase):
    """Coverage for the remaining supported resources and secured workflows."""

    image_bytes = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )

    def test_staff_crud_validation_search_and_profile_upload(self):
        self.assertEqual(self.staff_client.get("/api/staff/").status_code, 403)
        invalid = self.admin_client.post(
            "/api/staff/",
            {"first_name": "Missing", "last_name": "Password", "email": "missing@example.test"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)

        image = SimpleUploadedFile("profile.png", self.image_bytes, content_type="image/png")
        created = self.admin_client.post(
            "/api/staff/",
            {
                "first_name": "Field",
                "last_name": "Engineer",
                "email": "field-engineer@example.test",
                "password": "field-password",
                "designation": "Technician",
                "profile_image": image,
            },
            format="multipart",
        )
        self.assertEqual(created.status_code, 201, created.data)
        staff = Staff.objects.get(pk=created.data["id"])
        self.assertEqual(staff.name, "Field Engineer")
        self.assertTrue(staff.profile_image.storage.exists(staff.profile_image.name))
        listing = self.admin_client.get("/api/staff/?search=Engineer")
        self.assertEqual(listing.status_code, 200)
        self.assertTrue(any(row["id"] == staff.pk for row in listing.data))
        updated = self.admin_client.patch(
            f"/api/staff/{staff.pk}/", {"phone": "9999999999", "is_active": False}, format="json"
        )
        self.assertEqual(updated.status_code, 200)
        self.assertFalse(updated.data["is_active"])
        self.assertFalse(get_user_model().objects.get(pk=staff.user_id).is_active)
        self.assertEqual(
            self.admin_client.post(f"/api/staff/{staff.pk}/toggle_status/", {}, format="json").status_code,
            200,
        )
        self.assertEqual(self.admin_client.delete(f"/api/staff/{staff.pk}/").status_code, 204)

    def test_job_activity_templates_and_checklists_full_crud_validation_search(self):
        self.assertEqual(self.staff_client.get("/api/job-activity-templates/").status_code, 403)
        invalid = self.admin_client.post(
            "/api/job-activity-templates/", {"description": "No name"}, format="json"
        )
        self.assertEqual(invalid.status_code, 400)
        template_response = self.admin_client.post(
            "/api/job-activity-templates/",
            {"name": "Installation Checklist Template", "activity_type": "installation"},
            format="json",
        )
        self.assertEqual(template_response.status_code, 201, template_response.data)
        template_id = template_response.data["id"]
        self.assertTrue(
            any(
                row["id"] == template_id
                for row in self.admin_client.get(
                    "/api/job-activity-templates/?search=Installation"
                ).data
            )
        )
        checklist = self.admin_client.post(
            "/api/job-activity-checklists/",
            {"template": template_id, "name": "Mount camera", "description": "Use anchors", "position": 1, "is_required": True},
            format="json",
        )
        self.assertEqual(checklist.status_code, 201, checklist.data)
        checklist_id = checklist.data["id"]
        self.assertEqual(checklist.data["template_name"], "Installation Checklist Template")
        filtered = self.admin_client.get(
            f"/api/job-activity-checklists/?template={template_id}&search=Mount"
        )
        self.assertEqual(filtered.status_code, 200)
        self.assertTrue(any(row["id"] == checklist_id for row in filtered.data))
        updated = self.admin_client.patch(
            f"/api/job-activity-checklists/{checklist_id}/",
            {"name": "Mount DVR", "is_required": False},
            format="json",
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["name"], "Mount DVR")
        self.assertEqual(self.admin_client.delete(f"/api/job-activity-checklists/{checklist_id}/").status_code, 204)
        self.assertEqual(self.admin_client.delete(f"/api/job-activity-templates/{template_id}/").status_code, 204)

    def test_direct_invoice_crud_preserves_workflow_relationships(self):
        customer = Customer.objects.create(name="Invoice Verification Customer")
        enquiry = Enquiry.objects.create(title="Invoice Verification Enquiry", customer=customer)
        quotation = Quotation.objects.create(
            number="VERIFY-Q-001", title="Invoice Verification Quote", customer=customer, enquiry=enquiry
        )
        proforma = self.staff_client.post(
            "/api/proforma-invoices/",
            {
                "number": "VERIFY-PI-001",
                "quotation": quotation.pk,
                "enquiry": enquiry.pk,
                "customer": customer.pk,
                "invoice_date": "2026-09-18",
                "items": [{"item": "Camera", "quantity": "2", "rate": "100.00", "tax": "18.00"}],
            },
            format="json",
        )
        self.assertEqual(proforma.status_code, 201, proforma.data)
        proforma_id = proforma.data["id"]
        self.assertEqual(Decimal(proforma.data["amount"]), Decimal("200.00"))
        self.assertTrue(any(row["id"] == proforma_id for row in self.staff_client.get("/api/proforma-invoices/?search=VERIFY-PI").data))
        gst = self.staff_client.post(
            "/api/gst-invoices/",
            {
                "number": "VERIFY-INV-001",
                "proforma_invoice": proforma_id,
                "quotation": quotation.pk,
                "enquiry": enquiry.pk,
                "customer": customer.pk,
                "reference_number": "REF-VERIFY",
                "items": [{"item": "Camera", "quantity": "1", "rate": "200.00", "tax": "18.00"}],
            },
            format="json",
        )
        self.assertEqual(gst.status_code, 201, gst.data)
        gst_id = gst.data["id"]
        self.assertTrue(any(row["id"] == gst_id for row in self.staff_client.get("/api/gst-invoices/?search=REF-VERIFY").data))
        self.assertEqual(
            self.staff_client.patch(
                f"/api/proforma-invoices/{proforma_id}/", {"status": "sent"}, format="json"
            ).status_code,
            200,
        )
        self.assertEqual(
            self.staff_client.patch(
                f"/api/gst-invoices/{gst_id}/", {"status": "paid"}, format="json"
            ).status_code,
            200,
        )
        self.assertEqual(self.staff_client.delete(f"/api/gst-invoices/{gst_id}/").status_code, 204)
        self.assertEqual(self.staff_client.delete(f"/api/proforma-invoices/{proforma_id}/").status_code, 204)

    def test_activity_log_read_detail_search_date_clear_and_admin_auth(self):
        old_log = ActivityLog.objects.create(description="Old searchable event", staff="Test Staff")
        old_log.occurred_at = timezone.now() - timedelta(days=2)
        old_log.save(update_fields=("occurred_at",))
        today = ActivityLog.objects.create(description="Today searchable event", staff="Test Staff")
        self.assertEqual(self.staff_client.get("/api/activity-logs/").status_code, 403)
        self.assertEqual(self.admin_client.get(f"/api/activity-logs/{today.pk}/").status_code, 200)
        search = self.admin_client.get("/api/activity-logs/?search=Today")
        self.assertEqual(search.status_code, 200)
        self.assertTrue(any(row["id"] == today.pk for row in search.data))
        today.refresh_from_db()
        date = timezone.localtime(today.occurred_at).date().isoformat()
        dated = self.admin_client.get(f"/api/activity-logs/?date={date}")
        self.assertEqual(dated.status_code, 200)
        self.assertTrue(
            any(row["id"] == today.pk for row in dated.data),
            f"date={date}, occurred_at={today.occurred_at}, logs={dated.data}",
        )
        self.assertEqual(self.staff_client.delete("/api/activity-logs/clear/").status_code, 403)
        self.assertEqual(self.admin_client.delete(f"/api/activity-logs/clear/?date={date}").status_code, 204)
        self.assertFalse(ActivityLog.objects.filter(pk=today.pk).exists())
        self.assertTrue(ActivityLog.objects.filter(pk=old_log.pk).exists())

    def test_z_database_backup_metadata_download_path_delete_and_retention(self):
        self.assertEqual(self.staff_client.get("/api/database-backups/").status_code, 403)
        created = self.admin_client.post("/api/database-backups/", {}, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        backup = DatabaseBackup.objects.get(pk=created.data["id"])
        metadata = self.admin_client.get(f"/api/database-backups/{backup.pk}/")
        self.assertEqual(metadata.status_code, 200)
        self.assertEqual(metadata.data["size"], backup.size)
        download = self.admin_client.get(f"/api/database-backups/{backup.pk}/download/")
        self.assertEqual(download.status_code, 200)
        self.assertEqual(download["Content-Disposition"].startswith("attachment;"), True)
        list(download.streaming_content)
        download.close()
        self.assertEqual(self.staff_client.get(f"/api/database-backups/{backup.pk}/download/").status_code, 403)

    def test_database_backup_retention_and_admin_delete(self):
        with self.assertRaises(CommandError):
            call_command("backup_database", retention_days=-1, no_upload=True, verbosity=0)
        created = self.admin_client.post("/api/database-backups/", {}, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        backup_id = created.data["id"]
        self.assertEqual(self.admin_client.delete(f"/api/database-backups/{backup_id}/").status_code, 204)
        self.assertFalse(DatabaseBackup.objects.filter(pk=backup_id).exists())

    def test_staff_item_and_expense_uploads_are_stored(self):
        group = ItemGroup.objects.create(name="Upload Item Group")
        item_image = SimpleUploadedFile("item.png", self.image_bytes, content_type="image/png")
        item = self.staff_client.post(
            "/api/items/",
            {"name": "Uploaded Camera", "group": group.pk, "image": item_image},
            format="multipart",
        )
        self.assertEqual(item.status_code, 201, item.data)
        item_obj = Item.objects.get(pk=item.data["id"])
        self.assertTrue(item_obj.image.storage.exists(item_obj.image.name))
        category = ExpenseCategory.objects.create(name="Upload Expense Category")
        expense_file = SimpleUploadedFile("receipt.txt", b"isolated receipt", content_type="text/plain")
        expense = self.staff_client.post(
            "/api/expenses/",
            {"name": "Uploaded Receipt", "category": category.pk, "expense_date": "2026-09-18", "amount": "12.50", "attachment": expense_file},
            format="multipart",
        )
        self.assertEqual(expense.status_code, 201, expense.data)
        expense_obj = Expense.objects.get(pk=expense.data["id"])
        self.assertTrue(expense_obj.attachment.storage.exists(expense_obj.attachment.name))

    def test_remaining_setup_resources_are_crud_searchable_and_admin_only(self):
        resources = (
            ("predefined-replies", {"name": "Welcome Reply", "body": "Welcome", "subject": "Hello"}),
            ("complaint-priorities", {"name": "Urgent Priority", "level": 5, "color": "red"}),
            ("email-integrations", {"name": "SMTP Integration", "provider": "smtp", "password": "secret"}),
            ("web-to-lead-forms", {"name": "Website Form", "slug": "website-form-verify", "fields": ["name"]}),
            ("lead-reasons", {"name": "Budget Reason", "reason_type": "lost"}),
            ("email-templates", {"name": "Invoice Template", "subject": "Invoice", "body": "Dear customer"}),
            ("theme-styles", {"name": "Dark Theme", "config": {"color": "dark"}}),
            ("settings", {"key": "verification.setting", "value": {"enabled": True}}),
        )
        for endpoint, payload in resources:
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.staff_client.get(f"/api/{endpoint}/").status_code, 403)
                created = self.admin_client.post(f"/api/{endpoint}/", payload, format="json")
                self.assertEqual(created.status_code, 201, created.data)
                identifier = created.data["id"]
                search_term = payload.get("name", payload.get("key"))
                self.assertTrue(
                    any(
                        row["id"] == identifier
                        for row in self.admin_client.get(f"/api/{endpoint}/?search={search_term}").data
                    )
                )
                self.assertEqual(self.admin_client.get(f"/api/{endpoint}/{identifier}/").status_code, 200)
                patch_field = "description" if endpoint not in ("settings",) else "is_public"
                updated = self.admin_client.patch(
                    f"/api/{endpoint}/{identifier}/",
                    {patch_field: "Updated" if patch_field == "description" else True},
                    format="json",
                )
                self.assertEqual(updated.status_code, 200, updated.data)
                self.assertEqual(self.admin_client.delete(f"/api/{endpoint}/{identifier}/").status_code, 204)

        role = self.admin_client.post("/api/roles/", {"name": "Verification Role"}, format="json")
        self.assertEqual(role.status_code, 201, role.data)
        self.assertEqual(self.staff_client.get("/api/roles/").status_code, 403)
        self.assertEqual(self.admin_client.patch(f"/api/roles/{role.data['id']}/", {"name": "Updated Role"}, format="json").status_code, 200)
        self.assertEqual(self.admin_client.delete(f"/api/roles/{role.data['id']}/").status_code, 204)
        menu = self.admin_client.post(
            "/api/menu-entries/",
            {"name": "Verification Menu", "key": "verification-menu", "path": "/verify"},
            format="json",
        )
        self.assertEqual(menu.status_code, 201, menu.data)
        self.assertEqual(self.admin_client.delete(f"/api/menu-entries/{menu.data['id']}/").status_code, 204)


def successful_upload(path, record):
    return False
