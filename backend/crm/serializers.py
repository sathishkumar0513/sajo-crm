from decimal import Decimal

from rest_framework import serializers
from django.db.models import Sum

from .models import AMCContract, ActivityLog, AdvancePayment, AMCType, CalendarEvent, Campaign, Complaint, ComplaintDepartment, ComplaintPriority, Contact, CreditNote, CreditNoteItem, Currency, Customer, CustomerGroup, DatabaseBackup, EmailIntegration, EmailTemplate, Enquiry, Expense, ExpenseCategory, GSTInvoice, GSTInvoiceItem, Goal, Item, ItemGroup, JobActivity, JobActivityChecklist, JobActivityTemplate, Lead, LeadHotnessLevel, LeadReason, LeadSource, LeadStatus, MenuEntry, Payment, PaymentMode, PredefinedReply, ProformaInvoice, ProformaInvoiceItem, Project, PurchaseInvoice, PurchaseInvoiceItem, PurchaseOrder, PurchaseOrderItem, Quotation, QuotationItem, ReferralPartner, Setting, Staff, StaffDesignation, TaxRate, ThemeStyle, Todo, Unit, Vendor, WebToLeadForm
from django.contrib.auth.models import Group


def _decimal_item_values(item, fields=("quantity", "rate", "tax")):
    normalized = dict(item)
    for field in fields:
        if field in normalized and normalized[field] not in (None, ""):
            normalized[field] = Decimal(str(normalized[field]))
    return normalized


class StaffSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    def create(self, validated_data):
        from django.contrib.auth import get_user_model
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "A password is required for a staff login."})
        validated_data["name"] = " ".join(
            part for part in (validated_data.get("first_name"), validated_data.get("last_name")) if part
        ) or validated_data.get("name", "")
        email = validated_data.get("email", "").strip().lower()
        User = get_user_model()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A login user already exists with this email."})
        user = User.objects.create_user(username=email, email=email, password=password, first_name=validated_data.get("first_name", ""), last_name=validated_data.get("last_name", ""), is_staff=validated_data.get("is_administrator", False), is_active=validated_data.get("is_active", True))
        return super().create({**validated_data, "user": user})

    def update(self, instance, validated_data):
        from django.contrib.auth import get_user_model
        password = validated_data.pop("password", None)
        first_name = validated_data.get("first_name", instance.first_name)
        last_name = validated_data.get("last_name", instance.last_name)
        validated_data["name"] = " ".join(part for part in (first_name, last_name) if part) or instance.name
        email = validated_data.get("email", instance.email).strip().lower()
        User = get_user_model()
        user = instance.user
        if user and User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError({"email": "A login user already exists with this email."})
        validated_data["email"] = email
        updated = super().update(instance, validated_data)
        if user:
            user.username = email
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.is_staff = updated.is_administrator
            user.is_active = updated.is_active
            if password:
                user.set_password(password)
            user.save()
        elif password:
            user = User.objects.create_user(username=email, email=email, password=password, first_name=first_name, last_name=last_name, is_staff=updated.is_administrator, is_active=updated.is_active)
            updated.user = user
            updated.save(update_fields=("user",))
        return updated

    class Meta:
        model = Staff
        fields = "__all__"
        read_only_fields = ("user",)


class SetupModelSerializer(serializers.ModelSerializer):
    class Meta:
        fields = "__all__"


class CustomerGroupSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = CustomerGroup


class StaffDesignationSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = StaffDesignation


class ComplaintDepartmentSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = ComplaintDepartment


class PredefinedReplySerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = PredefinedReply


class ComplaintPrioritySerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = ComplaintPriority


class JobActivityTemplateSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = JobActivityTemplate


class JobActivityChecklistSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True)

    class Meta:
        model = JobActivityChecklist
        fields = "__all__"
        read_only_fields = ("template_name",)


class LeadSourceSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = LeadSource


class LeadStatusSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = LeadStatus


class LeadHotnessLevelSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = LeadHotnessLevel


class CampaignSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = Campaign


class EmailIntegrationSerializer(SetupModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta(SetupModelSerializer.Meta):
        model = EmailIntegration


class WebToLeadFormSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = WebToLeadForm


class LeadReasonSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = LeadReason


class TaxRateSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = TaxRate


class CurrencySerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = Currency


class PaymentModeSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = PaymentMode


class UnitSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = Unit


class AMCTypeSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = AMCType


class EmailTemplateSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = EmailTemplate


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ("id", "name", "permissions")
        read_only_fields = ("permissions",)


class MenuEntrySerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = MenuEntry


class ThemeStyleSerializer(SetupModelSerializer):
    class Meta(SetupModelSerializer.Meta):
        model = ThemeStyle


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = "__all__"


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = "__all__"


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = "__all__"
        read_only_fields = ("purchase_order", "amount")


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    vendor_name = serializers.CharField(source="vendor.company", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = "__all__"
        read_only_fields = ("subtotal", "total_tax", "total", "vendor_name", "assigned_to_name")

    def _save_items(self, order, items):
        order.items.all().delete()
        for item in items:
            PurchaseOrderItem.objects.create(purchase_order=order, **item)

    def _update_totals(self, order):
        subtotal = sum((item.amount for item in order.items.all()), Decimal("0"))
        tax = sum((item.amount * item.tax / Decimal("100") for item in order.items.all()), Decimal("0"))
        order.subtotal = subtotal
        order.total_tax = tax
        order.total = subtotal + tax + order.loading_charges + order.freight_charges
        order.save(update_fields=("subtotal", "total_tax", "total", "updated_at"))

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        order = PurchaseOrder.objects.create(**validated_data)
        self._save_items(order, items)
        self._update_totals(order)
        return order

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items is not None:
            self._save_items(instance, items)
        self._update_totals(instance)
        return instance


class PurchaseInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseInvoiceItem
        fields = "__all__"
        read_only_fields = ("purchase_invoice", "amount")


class PurchaseInvoiceSerializer(serializers.ModelSerializer):
    items = PurchaseInvoiceItemSerializer(many=True)
    vendor_name = serializers.CharField(source="vendor.company", read_only=True)
    purchase_order_number = serializers.CharField(source="purchase_order.number", read_only=True)

    class Meta:
        model = PurchaseInvoice
        fields = "__all__"
        read_only_fields = ("subtotal", "total_tax", "total", "vendor_name", "purchase_order_number")

    def _update_totals(self, invoice, items):
        invoice.items.all().delete()
        for item in items:
            PurchaseInvoiceItem.objects.create(purchase_invoice=invoice, **item)
        invoice.subtotal = sum((item.amount for item in invoice.items.all()), Decimal("0"))
        invoice.total_tax = sum((item.amount * item.tax / Decimal("100") for item in invoice.items.all()), Decimal("0"))
        invoice.total = invoice.subtotal + invoice.total_tax + invoice.loading_charges + invoice.freight_charges
        invoice.save(update_fields=("subtotal", "total_tax", "total", "updated_at"))

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        invoice = PurchaseInvoice.objects.create(**validated_data)
        self._update_totals(invoice, items)
        return invoice

    def update(self, instance, validated_data):
        items = validated_data.pop("items", [])
        instance = super().update(instance, validated_data)
        self._update_totals(instance, items)
        return instance


class ContactSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Contact
        fields = "__all__"


class CustomerSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    primary_contact = serializers.SerializerMethodField()
    contacts_count = serializers.SerializerMethodField()

    primary_first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    primary_last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    primary_salutation = serializers.CharField(write_only=True, required=False, allow_blank=True)
    primary_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    primary_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    primary_title = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def get_primary_contact(self, obj):
        primary = obj.contacts.filter(is_primary=True).first() or obj.contacts.first()
        if primary:
            return ContactSerializer(primary).data
        return None

    def get_contacts_count(self, obj):
        return obj.contacts.count()

    def create(self, validated_data):
        primary_first_name = validated_data.pop("primary_first_name", None)
        primary_last_name = validated_data.pop("primary_last_name", "")
        primary_salutation = validated_data.pop("primary_salutation", "")
        primary_email = validated_data.pop("primary_email", "")
        primary_phone = validated_data.pop("primary_phone", "")
        primary_title = validated_data.pop("primary_title", "")

        customer = super().create(validated_data)

        if primary_first_name:
            Contact.objects.create(
                customer=customer,
                first_name=primary_first_name,
                last_name=primary_last_name,
                salutation=primary_salutation,
                email=primary_email or customer.email,
                phone=primary_phone or customer.phone,
                title=primary_title,
                is_primary=True,
                is_active=True,
            )
        return customer

    class Meta:
        model = Customer
        fields = "__all__"


class ReferralPartnerSerializer(serializers.ModelSerializer):
    leads_count = serializers.IntegerField(read_only=True)
    lead_conversions = serializers.IntegerField(read_only=True)
    enquiries_count = serializers.IntegerField(read_only=True)
    enquiries_won = serializers.IntegerField(read_only=True)

    class Meta:
        model = ReferralPartner
        fields = "__all__"
        read_only_fields = ("leads_count", "lead_conversions", "enquiries_count", "enquiries_won")


class ProjectSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ("customer_name", "assigned_to_name")


class AMCContractSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True, allow_null=True)

    class Meta:
        model = AMCContract
        fields = "__all__"
        read_only_fields = ("customer_name", "project_name")


class ComplaintSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    contact_name = serializers.CharField(source="contact.full_name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)
    job_activity_title = serializers.CharField(source="job_activity.title", read_only=True)

    class Meta:
        model = Complaint
        fields = "__all__"
        read_only_fields = ("customer_name", "contact_name", "assigned_to_name", "job_activity_title")


class LeadSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)
    converted_customer_name = serializers.CharField(source="converted_customer.name", read_only=True)
    converted_enquiry_title = serializers.CharField(source="converted_enquiry.title", read_only=True)

    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = ("assigned_to_name", "converted_customer_name", "converted_enquiry_title")


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = "__all__"


class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = "__all__"


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = "__all__"


class JobActivitySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    enquiry_title = serializers.CharField(source="enquiry.title", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)

    class Meta:
        model = JobActivity
        fields = "__all__"
        read_only_fields = ("customer_name", "enquiry_title", "project_name", "assigned_to_name")


class QuotationSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    quotation_items = serializers.SerializerMethodField(read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)

    def get_quotation_items(self, obj):
        return QuotationItemSerializer(obj.items.all(), many=True).data

    def _save_items(self, quotation, items):
        quotation.items.all().delete()
        subtotal = Decimal("0")
        for item in items:
            created = QuotationItem.objects.create(
                quotation=quotation, **_decimal_item_values(item)
            )
            subtotal += created.amount
        quotation.amount = subtotal - quotation.discount + quotation.adjustment + quotation.shipping_charge
        quotation.save(update_fields=("amount",))

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        quotation = Quotation.objects.create(**validated_data)
        self._save_items(quotation, items)
        return quotation

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items is not None:
            self._save_items(instance, items)
        return instance

    class Meta:
        model = Quotation
        fields = "__all__"
        read_only_fields = ("amount", "quotation_items", "customer_name", "assigned_to_name")


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = "__all__"
        read_only_fields = ("quotation", "amount")


class ProformaInvoiceSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    proforma_items = serializers.SerializerMethodField(read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    amount_with_tax = serializers.SerializerMethodField(read_only=True)
    balance = serializers.SerializerMethodField(read_only=True)

    def get_proforma_items(self, obj):
        return ProformaInvoiceItemSerializer(obj.items.all(), many=True).data

    def get_balance(self, obj):
        return obj.amount + obj.tax_amount - obj.amount_paid

    def get_amount_with_tax(self, obj):
        return obj.amount + obj.tax_amount

    def _save_items(self, invoice, items):
        invoice.items.all().delete()
        subtotal = Decimal("0")
        tax_total = Decimal("0")
        for item in items:
            created = ProformaInvoiceItem.objects.create(
                proforma_invoice=invoice, **_decimal_item_values(item)
            )
            subtotal += created.amount
            tax_total += created.amount * created.tax / Decimal("100")
        invoice.amount = subtotal - invoice.discount + invoice.shipping_charge
        invoice.tax_amount = tax_total
        invoice.save(update_fields=("amount", "tax_amount"))

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        invoice = ProformaInvoice.objects.create(**validated_data)
        self._save_items(invoice, items)
        return invoice

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items is not None:
            self._save_items(instance, items)
        return instance

    class Meta:
        model = ProformaInvoice
        fields = "__all__"
        read_only_fields = ("amount", "tax_amount", "proforma_items", "amount_with_tax", "balance", "customer_name")


class ProformaInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProformaInvoiceItem
        fields = "__all__"
        read_only_fields = ("proforma_invoice", "amount")


class GSTInvoiceSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    gst_items = serializers.SerializerMethodField(read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    sales_agent_name = serializers.CharField(source="sales_agent.name", read_only=True)
    amount_with_tax = serializers.SerializerMethodField(read_only=True)

    def get_gst_items(self, obj):
        return GSTInvoiceItemSerializer(obj.items.all(), many=True).data

    def get_amount_with_tax(self, obj):
        return obj.amount + obj.tax_amount

    def _save_items(self, invoice, items):
        invoice.items.all().delete()
        subtotal = Decimal("0")
        tax_total = Decimal("0")
        for item in items:
            created = GSTInvoiceItem.objects.create(
                gst_invoice=invoice, **_decimal_item_values(item)
            )
            subtotal += created.amount
            tax_total += created.amount * created.tax / Decimal("100")
        invoice.amount = subtotal - invoice.discount + invoice.shipping_charge + invoice.adjustment
        invoice.tax_amount = tax_total
        invoice.save(update_fields=("amount", "tax_amount"))

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        invoice = GSTInvoice.objects.create(**validated_data)
        self._save_items(invoice, items)
        return invoice

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items is not None:
            self._save_items(instance, items)
        return instance

    class Meta:
        model = GSTInvoice
        fields = "__all__"
        read_only_fields = ("amount", "tax_amount", "gst_items", "customer_name", "project_name", "sales_agent_name", "amount_with_tax")


class GSTInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTInvoiceItem
        fields = "__all__"
        read_only_fields = ("gst_invoice", "amount")


class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source="invoice.number", read_only=True)
    customer_name = serializers.CharField(source="invoice.customer.name", read_only=True)
    invoice_amount = serializers.SerializerMethodField(read_only=True)
    amount_due = serializers.SerializerMethodField(read_only=True)

    def get_invoice_amount(self, obj):
        return obj.invoice.amount + obj.invoice.tax_amount

    def get_amount_due(self, obj):
        paid = obj.invoice.payments.exclude(pk=obj.pk).aggregate(total=Sum("amount"))["total"] or 0
        return obj.invoice.amount + obj.invoice.tax_amount - paid - obj.amount

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ("invoice_number", "customer_name", "invoice_amount", "amount_due", "paid_at")


class AdvancePaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = AdvancePayment
        fields = "__all__"
        read_only_fields = ("customer_name", "created_at")


class CreditNoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditNoteItem
        fields = "__all__"
        read_only_fields = ("credit_note", "amount")


class CreditNoteSerializer(serializers.ModelSerializer):
    items = CreditNoteItemSerializer(many=True, required=False)
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    def _save_items(self, note, items):
        note.items.all().delete()
        subtotal = Decimal("0")
        for item in items:
            created = CreditNoteItem.objects.create(credit_note=note, **item)
            subtotal += created.amount
        note.amount = subtotal - note.discount + note.adjustment
        note.save(update_fields=("amount",))

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        note = CreditNote.objects.create(**validated_data)
        self._save_items(note, items)
        return note

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items is not None:
            self._save_items(instance, items)
        return instance

    class Meta:
        model = CreditNote
        fields = "__all__"
        read_only_fields = ("amount", "customer_name", "created_at")


class ItemGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemGroup
        fields = "__all__"
        read_only_fields = ("created_at",)


class ItemSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)
    image_url = serializers.SerializerMethodField(read_only=True)

    def get_image_url(self, obj):
        if not obj.image or not obj.image.storage.exists(obj.image.name):
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

    class Meta:
        model = Item
        fields = "__all__"
        read_only_fields = ("group_name", "image_url", "created_at")


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = "__all__"
        read_only_fields = ("created_at",)


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    attachment_url = serializers.SerializerMethodField(read_only=True)

    def get_attachment_url(self, obj):
        if not obj.attachment or not obj.attachment.storage.exists(obj.attachment.name):
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.attachment.url) if request else obj.attachment.url

    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = ("category_name", "customer_name", "project_name", "attachment_url", "created_at")


class ActivityLogSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source="occurred_at", read_only=True)

    class Meta:
        model = ActivityLog
        fields = ("id", "description", "date", "staff")


class GoalSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.name", read_only=True)

    class Meta:
        model = Goal
        fields = "__all__"
        read_only_fields = ("staff_name", "created_at")


class DatabaseBackupSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    def get_download_url(self, obj):
        request = self.context.get("request")
        url = f"/api/database-backups/{obj.pk}/download/"
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = DatabaseBackup
        fields = ("id", "name", "size", "created_at", "download_url")
