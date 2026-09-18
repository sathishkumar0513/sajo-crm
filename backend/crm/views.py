from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.db.models.functions import TruncDate
from django.db import transaction
from django.core.management import call_command
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.exceptions import SuspiciousFileOperation
from django.contrib.auth.models import Group
from django.http import FileResponse
from decimal import Decimal
from pathlib import Path
from datetime import datetime, time, timedelta
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .permissions import IsAdministrator

from .models import AMCContract, ActivityLog, AdvancePayment, AMCType, CalendarEvent, Campaign, Complaint, ComplaintDepartment, ComplaintPriority, Contact, CreditNote, Currency, Customer, CustomerGroup, DatabaseBackup, EmailIntegration, EmailTemplate, Enquiry, Expense, ExpenseCategory, GSTInvoice, Goal, Item, ItemGroup, JobActivity, JobActivityChecklist, JobActivityTemplate, Lead, LeadHotnessLevel, LeadReason, LeadSource, LeadStatus, MenuEntry, Payment, PaymentMode, PredefinedReply, ProformaInvoice, Project, PurchaseInvoice, PurchaseOrder, Quotation, ReferralPartner, Setting, Staff, StaffDesignation, TaxRate, ThemeStyle, Todo, Unit, Vendor, WebToLeadForm
from .serializers import AMCContractSerializer, ActivityLogSerializer, AdvancePaymentSerializer, AMCTypeSerializer, CalendarEventSerializer, CampaignSerializer, ComplaintDepartmentSerializer, ComplaintPrioritySerializer, ComplaintSerializer, ContactSerializer, CreditNoteSerializer, CurrencySerializer, CustomerGroupSerializer, CustomerSerializer, DatabaseBackupSerializer, EmailIntegrationSerializer, EmailTemplateSerializer, EnquirySerializer, ExpenseCategorySerializer, ExpenseSerializer, GSTInvoiceSerializer, GoalSerializer, ItemGroupSerializer, ItemSerializer, JobActivityChecklistSerializer, JobActivitySerializer, JobActivityTemplateSerializer, LeadHotnessLevelSerializer, LeadReasonSerializer, LeadSerializer, LeadSourceSerializer, LeadStatusSerializer, MenuEntrySerializer, PaymentModeSerializer, PaymentSerializer, PredefinedReplySerializer, ProformaInvoiceSerializer, ProjectSerializer, PurchaseInvoiceSerializer, PurchaseOrderSerializer, QuotationSerializer, ReferralPartnerSerializer, RoleSerializer, SettingSerializer, StaffDesignationSerializer, StaffSerializer, TaxRateSerializer, ThemeStyleSerializer, TodoSerializer, UnitSerializer, VendorSerializer, WebToLeadFormSerializer


class LoggedModelViewSet(viewsets.ModelViewSet):
    def _log(self, action, instance):
        staff = getattr(self.request.user, "staff_profile", None)
        actor = staff.name if staff else self.request.user.get_username()
        ActivityLog.objects.create(
            description=f"{action} {instance._meta.verbose_name} #{instance.pk}",
            staff=actor,
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log("Created", instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log("Updated", instance)

    def perform_destroy(self, instance):
        self._log("Deleted", instance)
        instance.delete()


class SetupModelViewSet(LoggedModelViewSet):
    permission_classes = (IsAdministrator,)
    search_fields = ("name", "description")
    ordering_fields = ("name", "created_at", "updated_at")


class CustomerGroupViewSet(SetupModelViewSet):
    queryset = CustomerGroup.objects.all()
    serializer_class = CustomerGroupSerializer


class StaffDesignationViewSet(SetupModelViewSet):
    queryset = StaffDesignation.objects.all()
    serializer_class = StaffDesignationSerializer


class ComplaintDepartmentViewSet(SetupModelViewSet):
    queryset = ComplaintDepartment.objects.all()
    serializer_class = ComplaintDepartmentSerializer


class PredefinedReplyViewSet(SetupModelViewSet):
    queryset = PredefinedReply.objects.select_related("department").all()
    serializer_class = PredefinedReplySerializer
    filterset_fields = ("department", "is_active")


class ComplaintPriorityViewSet(SetupModelViewSet):
    queryset = ComplaintPriority.objects.all()
    serializer_class = ComplaintPrioritySerializer


class JobActivityTemplateViewSet(SetupModelViewSet):
    queryset = JobActivityTemplate.objects.prefetch_related("checklist_items").all()
    serializer_class = JobActivityTemplateSerializer


class JobActivityChecklistViewSet(SetupModelViewSet):
    queryset = JobActivityChecklist.objects.select_related("template").all()
    serializer_class = JobActivityChecklistSerializer
    filterset_fields = ("template", "is_required")
    search_fields = ("name", "description")
    ordering_fields = ("position", "name")


class LeadSourceViewSet(SetupModelViewSet):
    queryset = LeadSource.objects.all()
    serializer_class = LeadSourceSerializer


class LeadStatusViewSet(SetupModelViewSet):
    queryset = LeadStatus.objects.all()
    serializer_class = LeadStatusSerializer


class LeadHotnessLevelViewSet(SetupModelViewSet):
    queryset = LeadHotnessLevel.objects.all()
    serializer_class = LeadHotnessLevelSerializer


class CampaignViewSet(SetupModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer


class EmailIntegrationViewSet(SetupModelViewSet):
    queryset = EmailIntegration.objects.all()
    serializer_class = EmailIntegrationSerializer


class WebToLeadFormViewSet(SetupModelViewSet):
    queryset = WebToLeadForm.objects.all()
    serializer_class = WebToLeadFormSerializer


class LeadReasonViewSet(SetupModelViewSet):
    queryset = LeadReason.objects.all()
    serializer_class = LeadReasonSerializer


class TaxRateViewSet(SetupModelViewSet):
    queryset = TaxRate.objects.all()
    serializer_class = TaxRateSerializer


class CurrencyViewSet(SetupModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer


class PaymentModeViewSet(SetupModelViewSet):
    queryset = PaymentMode.objects.all()
    serializer_class = PaymentModeSerializer


class UnitViewSet(SetupModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer


class AMCTypeViewSet(SetupModelViewSet):
    queryset = AMCType.objects.all()
    serializer_class = AMCTypeSerializer


class EmailTemplateViewSet(SetupModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer


class RoleViewSet(LoggedModelViewSet):
    permission_classes = (IsAdministrator,)
    queryset = Group.objects.all()
    serializer_class = RoleSerializer
    search_fields = ("name",)
    ordering_fields = ("name", "id")


class MenuEntryViewSet(SetupModelViewSet):
    queryset = MenuEntry.objects.select_related("parent").all()
    serializer_class = MenuEntrySerializer
    filterset_fields = ("menu_type", "parent", "is_active")


class ThemeStyleViewSet(SetupModelViewSet):
    queryset = ThemeStyle.objects.all()
    serializer_class = ThemeStyleSerializer


class SettingViewSet(LoggedModelViewSet):
    permission_classes = (IsAdministrator,)
    queryset = Setting.objects.all()
    serializer_class = SettingSerializer
    search_fields = ("key", "description")
    ordering_fields = ("key", "updated_at")


class StaffViewSet(LoggedModelViewSet):
    permission_classes = (IsAdministrator,)
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    filterset_fields = ("is_active", "designation")
    search_fields = ("name", "email", "phone", "designation")
    ordering_fields = ("name", "created_at", "designation")

    @action(detail=True, methods=("post",))
    def toggle_status(self, request, pk=None):
        staff = self.get_object()
        staff.is_active = not staff.is_active
        staff.save(update_fields=("is_active",))
        if staff.user:
            staff.user.is_active = staff.is_active
            staff.user.save(update_fields=("is_active",))
        return Response({"id": staff.id, "is_active": staff.is_active})


class VendorViewSet(LoggedModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    filterset_fields = ("is_active", "country", "state", "city", "product")
    search_fields = ("company", "gst_number", "phone", "email", "product", "city")
    ordering_fields = ("company", "created_at", "city")

    @action(detail=False, methods=("get",))
    def summary(self, request):
        return Response({
            "total_vendors": Vendor.objects.count(),
            "active_vendors": Vendor.objects.filter(is_active=True).count(),
            "inactive_vendors": Vendor.objects.filter(is_active=False).count(),
        })

    @action(detail=True, methods=("post",))
    def toggle_status(self, request, pk=None):
        vendor = self.get_object()
        vendor.is_active = not vendor.is_active
        vendor.save(update_fields=("is_active",))
        return Response({"id": vendor.id, "is_active": vendor.is_active})


class PurchaseOrderViewSet(LoggedModelViewSet):
    queryset = PurchaseOrder.objects.select_related("vendor", "assigned_to").prefetch_related("items").all()
    serializer_class = PurchaseOrderSerializer
    filterset_fields = ("vendor", "status", "assigned_to", "currency")
    search_fields = ("number", "reference", "vendor__company")
    ordering_fields = ("number", "purchase_order_date", "created_at", "total", "status")


class PurchaseInvoiceViewSet(LoggedModelViewSet):
    queryset = PurchaseInvoice.objects.select_related("vendor", "purchase_order", "assigned_to").prefetch_related("items").all()
    serializer_class = PurchaseInvoiceSerializer
    filterset_fields = ("vendor", "purchase_order", "status", "assigned_to", "payment_method")
    search_fields = ("number", "reference", "vendor__company")
    ordering_fields = ("number", "invoice_date", "created_at", "total", "status")


class CustomerViewSet(LoggedModelViewSet):
    queryset = Customer.objects.all()
    queryset = Customer.objects.prefetch_related("contacts").all()
    serializer_class = CustomerSerializer
    search_fields = ("name", "email", "phone")
    ordering_fields = ("name", "created_at")
    filterset_fields = ("is_active", "group")
    search_fields = ("name", "company", "email", "phone", "city", "group")
    ordering_fields = ("id", "name", "created_at", "is_active", "group")

    @action(detail=False, methods=["get"])
    def summary(self, request):
        return Response(
            {
                "total_customers": Customer.objects.count(),
                "active_customers": Customer.objects.filter(is_active=True).count(),
                "inactive_customers": Customer.objects.filter(is_active=False).count(),
                "active_contacts": Contact.objects.filter(is_active=True).count(),
                "inactive_contacts": Contact.objects.filter(is_active=False).count(),
            }
        )

    @action(detail=True, methods=["post"])
    def toggle_status(self, request, pk=None):
        customer = self.get_object()
        customer.is_active = not customer.is_active
        customer.save(update_fields=["is_active"])
        return Response({"id": customer.id, "is_active": customer.is_active})


class ReferralPartnerViewSet(LoggedModelViewSet):
    queryset = ReferralPartner.objects.annotate(
        leads_count=Count("leads"),
        lead_conversions=Count("leads", filter=Q(leads__status=Lead.Status.CUSTOMER)),
        enquiries_count=Count("enquiries"),
        enquiries_won=Count("enquiries", filter=Q(enquiries__status=Enquiry.Status.WON)),
    ).all()
    serializer_class = ReferralPartnerSerializer
    search_fields = ("name", "company", "position", "profession", "phone", "email", "city")
    ordering_fields = ("name", "company", "created_at", "updated_at")


class ProjectViewSet(LoggedModelViewSet):
    queryset = Project.objects.select_related("customer", "assigned_to").all()
    serializer_class = ProjectSerializer
    filterset_fields = ("stage", "status", "billing_type", "customer", "assigned_to")
    search_fields = ("number", "name", "tags", "customer__name", "assigned_to__name")
    ordering_fields = ("number", "name", "start_date", "estimated_delivery_date", "created_at", "status", "stage")


class AMCContractViewSet(LoggedModelViewSet):
    queryset = AMCContract.objects.select_related("customer", "project").all()
    serializer_class = AMCContractSerializer
    filterset_fields = ("status", "amc_type", "customer", "signature_status", "is_trashed")
    search_fields = ("subject", "amc_type", "customer__name", "description")
    ordering_fields = ("subject", "start_date", "end_date", "amc_value", "created_at")

    @action(detail=False, methods=("get",))
    def summary(self, request):
        today = timezone.localdate()
        soon = today + timedelta(days=30)
        contracts = list(AMCContract.objects.all())
        status_counts = {"active": 0, "expired": 0, "about_to_expire": 0, "recently_added": 0, "trash": 0}
        for contract in contracts:
            if contract.is_trashed or contract.status == AMCContract.Status.TRASH:
                status_counts["trash"] += 1
            elif contract.end_date and contract.end_date < today:
                status_counts["expired"] += 1
            elif contract.end_date and contract.end_date <= soon:
                status_counts["about_to_expire"] += 1
            elif contract.created_at and contract.created_at.date() >= today - timedelta(days=30):
                status_counts["recently_added"] += 1
            else:
                status_counts["active"] += 1
        return Response({
            "by_status": [{"status": status, "total": total} for status, total in status_counts.items()],
            "by_type": list(AMCContract.objects.values("amc_type").annotate(total=Count("id"), value=Sum("amc_value")).order_by("amc_type")),
            "total_value": AMCContract.objects.aggregate(value=Sum("amc_value"))["value"] or 0,
        })


class ComplaintViewSet(LoggedModelViewSet):
    queryset = Complaint.objects.select_related("customer", "contact", "assigned_to", "job_activity").all()
    serializer_class = ComplaintSerializer
    filterset_fields = ("status", "priority", "department", "customer", "assigned_to")
    search_fields = ("subject", "name", "email", "customer__name", "contact__first_name", "contact__last_name", "tags")
    ordering_fields = ("subject", "created_at", "updated_at", "last_reply_at", "priority", "status")

    @action(detail=False, methods=("get",))
    def summary(self, request):
        return Response({
            "by_status": list(Complaint.objects.values("status").annotate(total=Count("id")).order_by("status")),
            "total": Complaint.objects.count(),
        })


class ContactViewSet(LoggedModelViewSet):
    queryset = Contact.objects.select_related("customer").all()
    serializer_class = ContactSerializer
    filterset_fields = ("customer", "is_primary", "is_active")
    search_fields = ("first_name", "last_name", "email", "phone", "title")
    ordering_fields = ("first_name", "created_at", "is_primary")


class LeadViewSet(LoggedModelViewSet):
    queryset = Lead.objects.select_related("assigned_to", "converted_customer", "converted_enquiry").all()
    serializer_class = LeadSerializer
    filterset_fields = ("status", "source", "group", "assigned_to", "hotness", "is_public", "contacted_today")
    search_fields = ("name", "email", "phone", "company", "city", "source", "group")
    ordering_fields = ("name", "created_at", "status", "lead_value")

    @action(detail=True, methods=("post",))
    def convert(self, request, pk=None):
        lead = self.get_object()
        if lead.converted_customer_id or lead.converted_enquiry_id:
            return Response({"detail": "This lead has already been converted."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            customer = Customer.objects.create(
                name=lead.name,
                email=lead.email,
                phone=lead.phone,
            )
            enquiry = Enquiry.objects.create(
                title=request.data.get("enquiry_title") or f"Enquiry - {lead.name}",
                customer=customer,
                lead=lead,
                status=Enquiry.Status.NEW,
            )
            lead.converted_customer = customer
            lead.converted_enquiry = enquiry
            lead.status = Lead.Status.CUSTOMER
            lead.save(update_fields=("converted_customer", "converted_enquiry", "status"))

            follow_up_date = request.data.get("follow_up_date")
            if follow_up_date:
                Todo.objects.create(
                    title=f"Follow up - {lead.name}",
                    due_date=follow_up_date,
                    lead=lead,
                    enquiry=enquiry,
                    customer=customer,
                )

        return Response(
            {
                "lead": LeadSerializer(lead).data,
                "customer": CustomerSerializer(customer).data,
                "enquiry": EnquirySerializer(enquiry).data,
            },
            status=status.HTTP_201_CREATED,
        )


class EnquiryViewSet(LoggedModelViewSet):
    queryset = Enquiry.objects.select_related("customer", "lead", "assigned_to").all()
    serializer_class = EnquirySerializer
    filterset_fields = ("status", "customer", "lead", "assigned_to", "enquiry_type")
    search_fields = ("title", "email", "phone", "contacted_person", "site_location", "referred_by")
    ordering_fields = ("title", "created_at", "updated_at", "status", "date_of_visit")

    @action(detail=False, methods=("get",))
    def summary(self, request):
        counts = Enquiry.objects.values("status").annotate(total=Count("id"))
        return Response({
            "total": Enquiry.objects.count(),
            "by_status": list(counts),
        })


class CalendarEventViewSet(LoggedModelViewSet):
    queryset = CalendarEvent.objects.select_related("assigned_to", "lead", "enquiry", "customer").all()
    serializer_class = CalendarEventSerializer
    filterset_fields = ("event_type", "assigned_to")
    search_fields = ("title", "description", "event_type")
    ordering_fields = ("title", "start_at", "created_at")


class TodoViewSet(LoggedModelViewSet):
    queryset = Todo.objects.select_related("assigned_to", "lead", "enquiry", "customer").all()
    serializer_class = TodoSerializer
    filterset_fields = ("completed", "assigned_to")
    search_fields = ("title", "description")
    ordering_fields = ("title", "due_date", "created_at")


class JobActivityViewSet(LoggedModelViewSet):
    queryset = JobActivity.objects.select_related("customer", "enquiry", "project", "assigned_to").all()
    serializer_class = JobActivitySerializer
    filterset_fields = ("activity_type", "status", "priority", "customer", "enquiry", "project", "assigned_to")
    search_fields = ("title", "notes", "activity_type", "customer__name", "enquiry__title", "project__name", "assigned_to__name")
    ordering_fields = ("title", "start_date", "due_date", "created_at", "status", "priority")


class QuotationViewSet(LoggedModelViewSet):
    queryset = Quotation.objects.select_related("enquiry", "customer", "assigned_to").prefetch_related("items").all()
    serializer_class = QuotationSerializer
    filterset_fields = ("status", "enquiry", "customer")
    search_fields = ("number", "title", "customer__name")
    ordering_fields = ("number", "amount", "created_at")

    @action(detail=True, methods=("post",))
    def create_proforma(self, request, pk=None):
        quotation = self.get_object()
        proforma, _ = ProformaInvoice.objects.get_or_create(
            quotation=quotation,
            defaults={"number": f"PI-{quotation.number}", "enquiry": quotation.enquiry, "customer": quotation.customer, "amount": quotation.amount},
        )
        return Response(ProformaInvoiceSerializer(proforma).data, status=status.HTTP_201_CREATED)


class ProformaInvoiceViewSet(LoggedModelViewSet):
    queryset = ProformaInvoice.objects.select_related("quotation", "enquiry", "customer").prefetch_related("items").all()
    serializer_class = ProformaInvoiceSerializer
    filterset_fields = ("status", "quotation", "enquiry", "customer")
    search_fields = ("number", "customer__name")

    @action(detail=True, methods=("post",))
    def create_gst_invoice(self, request, pk=None):
        proforma = self.get_object()
        invoice, _ = GSTInvoice.objects.get_or_create(
            proforma_invoice=proforma,
            defaults={"number": f"INV-{proforma.number}", "quotation": proforma.quotation, "enquiry": proforma.enquiry, "customer": proforma.customer, "amount": proforma.amount, "tax_amount": proforma.amount * Decimal("0.18")},
        )
        return Response(GSTInvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class GSTInvoiceViewSet(LoggedModelViewSet):
    queryset = GSTInvoice.objects.select_related("proforma_invoice", "quotation", "enquiry", "customer", "project", "sales_agent").prefetch_related("items").all()
    serializer_class = GSTInvoiceSerializer
    filterset_fields = ("status", "customer", "enquiry", "project", "sales_agent")
    search_fields = ("number", "reference_number", "tags", "customer__name", "project__name")


class PaymentViewSet(LoggedModelViewSet):
    queryset = Payment.objects.select_related("invoice", "invoice__customer").all()
    serializer_class = PaymentSerializer
    filterset_fields = ("invoice", "payment_method")
    search_fields = ("reference", "payment_method", "invoice__number", "invoice__customer__name")


class AdvancePaymentViewSet(LoggedModelViewSet):
    queryset = AdvancePayment.objects.select_related("customer").all()
    serializer_class = AdvancePaymentSerializer
    filterset_fields = ("customer", "payment_method")
    search_fields = ("reference", "payment_method", "customer__name")


class CreditNoteViewSet(LoggedModelViewSet):
    queryset = CreditNote.objects.select_related("customer").prefetch_related("items").all()
    serializer_class = CreditNoteSerializer
    filterset_fields = ("customer", "currency")
    search_fields = ("number", "reference", "customer__name")


class ItemGroupViewSet(LoggedModelViewSet):
    queryset = ItemGroup.objects.all()
    serializer_class = ItemGroupSerializer
    search_fields = ("name",)


class ItemViewSet(LoggedModelViewSet):
    queryset = Item.objects.select_related("group").all()
    serializer_class = ItemSerializer
    filterset_fields = ("group", "item_type")
    search_fields = ("name", "description", "hsn_code", "sku", "group__name")


class ExpenseCategoryViewSet(LoggedModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    search_fields = ("name",)


class ExpenseViewSet(LoggedModelViewSet):
    queryset = Expense.objects.select_related("category", "customer", "project").all()
    serializer_class = ExpenseSerializer
    filterset_fields = ("category", "customer", "project", "payment_mode")
    search_fields = ("name", "note", "reference", "category__name", "customer__name", "project__name")


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (IsAdministrator,)
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    search_fields = ("description", "staff")

    def get_queryset(self):
        queryset = super().get_queryset()
        date_value = self.request.query_params.get("date")
        if date_value:
            try:
                selected_date = datetime.strptime(date_value, "%Y-%m-%d").date()
            except ValueError:
                return queryset.none()
            start = timezone.make_aware(datetime.combine(selected_date, time.min))
            end = start + timedelta(days=1)
            queryset = queryset.filter(occurred_at__gte=start, occurred_at__lt=end)
        return queryset

    @action(detail=False, methods=("delete",), permission_classes=(IsAdministrator,))
    def clear(self, request):
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoalViewSet(LoggedModelViewSet):
    queryset = Goal.objects.select_related("staff").all()
    serializer_class = GoalSerializer
    filterset_fields = ("goal_type", "staff")
    search_fields = ("subject", "goal_type", "description", "staff__name")


class DatabaseBackupViewSet(LoggedModelViewSet):
    permission_classes = (IsAdministrator,)
    queryset = DatabaseBackup.objects.all()
    serializer_class = DatabaseBackupSerializer
    http_method_names = ("get", "post", "delete", "head", "options")

    def create(self, request, *args, **kwargs):
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        filename = f"crm_backup_{timestamp}.json"
        from io import StringIO
        output = StringIO()
        call_command(
            "dumpdata",
            "--natural-foreign",
            "--natural-primary",
            "--exclude",
            "contenttypes",
            "--exclude",
            "auth.permission",
            stdout=output,
        )
        content = output.getvalue().encode("utf-8")
        record = DatabaseBackup(name=filename, size=len(content))
        record.file.save(filename, ContentFile(content), save=False)
        record.save()
        self._log("Created", record)
        return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=("get",), permission_classes=(IsAdministrator,))
    def download(self, request, pk=None):
        record = self.get_object()
        if not record.file:
            return Response({"detail": "Backup file is unavailable."}, status=status.HTTP_404_NOT_FOUND)
        backup_root = Path(settings.BACKUP_ROOT).resolve()
        try:
            file_path = Path(record.file.path).resolve()
        except (FileNotFoundError, SuspiciousFileOperation, ValueError):
            return Response({"detail": "Backup file is unavailable."}, status=status.HTTP_404_NOT_FOUND)
        if backup_root not in file_path.parents:
            return Response({"detail": "Backup file is unavailable."}, status=status.HTTP_404_NOT_FOUND)
        if not record.file.storage.exists(record.file.name):
            return Response({"detail": "Backup file is unavailable."}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(record.file.open("rb"), as_attachment=True, filename=record.name)

    def perform_destroy(self, instance):
        self._log("Deleted", instance)
        instance.file.delete(save=False)
        instance.delete()


class DashboardView(APIView):
    def get(self, request):
        today = timezone.localdate()
        week_start = today - timedelta(days=6)
        return Response(
            {
                "quick_statistics": {
                    "total_customers": Customer.objects.count(),
                    "active_customers": Customer.objects.filter(is_active=True).count(),
                    "inactive_customers": Customer.objects.filter(is_active=False).count(),
                    "total_leads": Lead.objects.count(),
                    "total_enquiries": Enquiry.objects.count(),
                    "total_vendors": Vendor.objects.count(),
                    "total_purchase_orders": PurchaseOrder.objects.count(),
                    "total_purchase_invoices": PurchaseInvoice.objects.count(),
                    "purchase_invoice_total": PurchaseInvoice.objects.aggregate(total=Sum("total"))["total"] or 0,
                },
                "leads_status": list(
                    Lead.objects.values("status").annotate(total=Count("id")).order_by("status")
                ),
                "enquiries_status": list(
                    Enquiry.objects.values("status").annotate(total=Count("id")).order_by("status")
                ),
                "enquiries_daily": list(
                    Enquiry.objects.annotate(day=TruncDate("created_at"))
                    .values("day")
                    .annotate(total=Count("id"))
                    .order_by("day")
                ),
                "leads_daily": list(
                    Lead.objects.annotate(day=TruncDate("created_at"))
                    .values("day")
                    .annotate(total=Count("id"))
                    .order_by("day")
                ),
                "quotations_status": list(
                    Quotation.objects.values("status").annotate(total=Count("id")).order_by("status")
                ),
                "purchase_orders_status": list(
                    PurchaseOrder.objects.values("status").annotate(total=Count("id")).order_by("status")
                ),
                "purchase_invoices_status": list(
                    PurchaseInvoice.objects.values("status").annotate(total=Count("id")).order_by("status")
                ),
                "job_activities_status": list(
                    JobActivity.objects.values("status").annotate(total=Count("id")).order_by("status")
                ),
                "payments_weekly": list(
                    Payment.objects.filter(paid_at__date__gte=week_start)
                    .annotate(day=TruncDate("paid_at"))
                    .values("day")
                    .annotate(total=Count("id"))
                    .order_by("day")
                ),
                "calendar_events_count": CalendarEvent.objects.filter(start_at__date__gte=today).count(),
                "upcoming_events": CalendarEventSerializer(
                    CalendarEvent.objects.filter(start_at__gte=timezone.now()).order_by("start_at")[:5],
                    many=True,
                ).data + [
                    {
                        **JobActivitySerializer(activity).data,
                        "start_at": activity.start_date.isoformat(),
                        "event_type": "job_activity",
                        "isJobActivity": True,
                    }
                    for activity in JobActivity.objects.filter(
                        start_date__gte=today,
                        status__in=(JobActivity.Status.PLANNED, JobActivity.Status.IN_PROGRESS),
                    ).order_by("start_date")[:5]
                ],
                "open_todos": TodoSerializer(
                    Todo.objects.filter(completed=False).order_by("due_date", "-created_at")[:5],
                    many=True,
                ).data,
            }
        )
