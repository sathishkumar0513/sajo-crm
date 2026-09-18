from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models


private_backup_storage = FileSystemStorage(location=settings.BACKUP_ROOT)


class Staff(models.Model):
    user = models.OneToOneField("auth.User", on_delete=models.CASCADE, null=True, blank=True, related_name="staff_profile")
    name = models.CharField(max_length=160)
    profile_image = models.ImageField(upload_to="staff/", null=True, blank=True)
    first_name = models.CharField(max_length=80, blank=True)
    last_name = models.CharField(max_length=80, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=40, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    designation = models.CharField(max_length=120, blank=True)
    date_joined = models.DateField(null=True, blank=True)
    is_administrator = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)
        indexes = [models.Index(fields=("is_active",)), models.Index(fields=("designation",))]

    def __str__(self):
        return self.name


class SetupNamedModel(models.Model):
    name = models.CharField(max_length=160, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("name",)

    def __str__(self):
        return self.name


class CustomerGroup(SetupNamedModel):
    pass


class StaffDesignation(SetupNamedModel):
    pass


class ComplaintDepartment(SetupNamedModel):
    pass


class PredefinedReply(SetupNamedModel):
    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    department = models.ForeignKey(ComplaintDepartment, on_delete=models.SET_NULL, null=True, blank=True, related_name="predefined_replies")


class ComplaintPriority(SetupNamedModel):
    level = models.PositiveSmallIntegerField(default=0)
    color = models.CharField(max_length=30, blank=True)


class JobActivityTemplate(SetupNamedModel):
    activity_type = models.CharField(max_length=80, default="other")
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    checklist = models.JSONField(default=list, blank=True)


class JobActivityChecklist(models.Model):
    template = models.ForeignKey(JobActivityTemplate, on_delete=models.CASCADE, related_name="checklist_items")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    position = models.PositiveIntegerField(default=0)
    is_required = models.BooleanField(default=False)

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return self.name


class LeadSource(SetupNamedModel):
    pass


class LeadStatus(SetupNamedModel):
    position = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)

    class Meta:
        ordering = ("position", "name")


class LeadHotnessLevel(SetupNamedModel):
    score = models.PositiveSmallIntegerField(default=0)
    color = models.CharField(max_length=30, blank=True)


class Campaign(SetupNamedModel):
    code = models.CharField(max_length=80, unique=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)


class EmailIntegration(SetupNamedModel):
    provider = models.CharField(max_length=80, default="smtp")
    host = models.CharField(max_length=255, blank=True)
    port = models.PositiveIntegerField(default=587)
    username = models.CharField(max_length=255, blank=True)
    password = models.CharField(max_length=255, blank=True)
    from_email = models.EmailField(blank=True)
    use_tls = models.BooleanField(default=True)


class WebToLeadForm(SetupNamedModel):
    slug = models.SlugField(max_length=160, unique=True)
    fields = models.JSONField(default=list, blank=True)
    success_message = models.CharField(max_length=255, blank=True)


class LeadReason(SetupNamedModel):
    reason_type = models.CharField(max_length=40, default="lost")


class TaxRate(SetupNamedModel):
    rate = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    is_compound = models.BooleanField(default=False)


class Currency(SetupNamedModel):
    code = models.CharField(max_length=10, unique=True)
    symbol = models.CharField(max_length=10, blank=True)
    exchange_rate = models.DecimalField(max_digits=12, decimal_places=6, default=1)
    is_default = models.BooleanField(default=False)


class PaymentMode(SetupNamedModel):
    pass


class Unit(SetupNamedModel):
    abbreviation = models.CharField(max_length=30, blank=True)


class AMCType(SetupNamedModel):
    default_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)


class EmailTemplate(SetupNamedModel):
    subject = models.CharField(max_length=255)
    body = models.TextField()
    variables = models.JSONField(default=list, blank=True)


class MenuEntry(SetupNamedModel):
    class MenuType(models.TextChoices):
        MAIN = "main", "Main Menu"
        SETUP = "setup", "Setup Menu"

    key = models.SlugField(max_length=160, unique=True)
    path = models.CharField(max_length=255, blank=True)
    icon = models.CharField(max_length=80, blank=True)
    position = models.PositiveIntegerField(default=0)
    menu_type = models.CharField(max_length=20, choices=MenuType.choices, default=MenuType.MAIN)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")

    class Meta:
        ordering = ("menu_type", "position", "name")


class ThemeStyle(SetupNamedModel):
    config = models.JSONField(default=dict, blank=True)
    is_default = models.BooleanField(default=False)


class Setting(models.Model):
    key = models.CharField(max_length=160, unique=True)
    value = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("key",)

    def __str__(self):
        return self.key


class Vendor(models.Model):
    company = models.CharField(max_length=160)
    gst_number = models.CharField(max_length=40, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    product = models.CharField(max_length=160, blank=True)
    address = models.TextField(blank=True)
    country = models.CharField(max_length=100, default="India")
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("company",)
        indexes = [
            models.Index(fields=("company",)),
            models.Index(fields=("gst_number",)),
            models.Index(fields=("is_active",)),
        ]

    def __str__(self):
        return self.company


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        APPROVED = "approved", "Approved"
        RECEIVED = "received", "Received"
        CANCELLED = "cancelled", "Cancelled"

    number = models.CharField(max_length=40, unique=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="purchase_orders")
    reference = models.CharField(max_length=120, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    purchase_order_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="purchase_orders")
    payment_terms = models.TextField(blank=True)
    delivery_terms = models.TextField(blank=True)
    project_notes = models.TextField(blank=True)
    loading_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    freight_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("status",)), models.Index(fields=("vendor",)), models.Index(fields=("purchase_order_date",))]

    def __str__(self):
        return self.number


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product = models.CharField(max_length=200)
    hsn_code = models.CharField(max_length=40, blank=True)
    brand = models.CharField(max_length=120, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit = models.CharField(max_length=30, default="Unit")
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ("id",)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.product


class PurchaseInvoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        UNPAID = "unpaid", "Unpaid"
        PARTIAL = "partial", "Partially Paid"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"

    number = models.CharField(max_length=40, unique=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="purchase_invoices")
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name="purchase_invoices")
    reference = models.CharField(max_length=120, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    payment_method = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    invoice_date = models.DateField()
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="purchase_invoices")
    payment_terms = models.TextField(blank=True)
    delivery_terms = models.TextField(blank=True)
    project_notes = models.TextField(blank=True)
    loading_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    freight_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("status",)), models.Index(fields=("vendor",)), models.Index(fields=("invoice_date",))]

    def __str__(self):
        return self.number


class PurchaseInvoiceItem(models.Model):
    purchase_invoice = models.ForeignKey(PurchaseInvoice, on_delete=models.CASCADE, related_name="items")
    product = models.CharField(max_length=200)
    hsn_code = models.CharField(max_length=40, blank=True)
    brand = models.CharField(max_length=120, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit = models.CharField(max_length=30, default="Unit")
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)


class Customer(models.Model):
    name = models.CharField(max_length=160)
    class Group(models.TextChoices):
        COLLEGE_UNIVERSITY = "College / University", "College / University"
        HOSPITAL = "Hospital", "Hospital"
        HOTEL = "Hotel", "Hotel"
        IT_CORPORATE = "IT / Corporate", "IT / Corporate"
        SCHOOL = "School", "School"
        OTHER = "Other", "Other"

    name = models.CharField(max_length=160)  # Company / Customer name (e.g. Messrs. Milestone Designs)
    company = models.CharField(max_length=160, blank=True)
    group = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    website = models.CharField(max_length=200, blank=True)
    gst_number = models.CharField(max_length=40, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="India")
    zip_code = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("email",)), models.Index(fields=("phone",))]
        indexes = [
            models.Index(fields=("email",)),
            models.Index(fields=("phone",)),
            models.Index(fields=("group",)),
            models.Index(fields=("is_active",)),
        ]

    def __str__(self):
        return self.name


class ReferralPartner(models.Model):
    name = models.CharField(max_length=160)
    company = models.CharField(max_length=160, blank=True)
    position = models.CharField(max_length=120, blank=True)
    profession = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("name",)), models.Index(fields=("company",)), models.Index(fields=("city",))]

    def __str__(self):
        return self.name


class Project(models.Model):
    class Stage(models.TextChoices):
        SUPPLY = "supply", "Supply"
        INSTALLATION = "installation", "Installation"
        SERVICE = "service", "Service"
        COMPLETED = "completed", "Completed"

    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        IN_PROGRESS = "in_progress", "In Progress"
        ON_HOLD = "on_hold", "On Hold"
        CANCELLED = "cancelled", "Cancelled"
        CLOSED = "closed", "Closed"

    class BillingType(models.TextChoices):
        FIXED_RATE = "fixed_rate", "Fixed Rate"
        HOURLY = "hourly", "Hourly"

    number = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=200)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="projects")
    stage = models.CharField(max_length=30, choices=Stage.choices, default=Stage.SUPPLY)
    tags = models.CharField(max_length=255, blank=True)
    start_date = models.DateField()
    estimated_delivery_date = models.DateField(null=True, blank=True)
    billing_type = models.CharField(max_length=20, choices=BillingType.choices, default=BillingType.FIXED_RATE)
    total_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS)
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    progress = models.PositiveSmallIntegerField(default=0)
    description = models.TextField(blank=True)
    visible_tabs = models.JSONField(default=list, blank=True)
    customer_can_view_job_activities = models.BooleanField(default=True)
    customer_can_create_job_activities = models.BooleanField(default=True)
    customer_can_edit_job_activities = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("status",)), models.Index(fields=("stage",)), models.Index(fields=("start_date",))]

    def __str__(self):
        return f"{self.number} - {self.name}"


class AMCContract(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        ABOUT_TO_EXPIRE = "about_to_expire", "About to Expire"
        RECENTLY_ADDED = "recently_added", "Recently Added"
        TRASH = "trash", "Trash"

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="amc_contracts")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="amc_contracts")
    subject = models.CharField(max_length=200)
    amc_type = models.CharField(max_length=120, blank=True)
    amc_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.ACTIVE)
    is_trashed = models.BooleanField(default=False)
    hide_from_customer = models.BooleanField(default=False)
    signature_status = models.CharField(max_length=30, default="not_signed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("status",)), models.Index(fields=("amc_type",)), models.Index(fields=("start_date",)), models.Index(fields=("end_date",))]

    def __str__(self):
        return self.subject


class Complaint(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In Progress"
        ANSWERED = "answered", "Answered"
        ON_HOLD = "on_hold", "On Hold"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    subject = models.CharField(max_length=200)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
    contact = models.ForeignKey("Contact", on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_complaints")
    job_activity = models.ForeignKey("JobActivity", on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
    department = models.CharField(max_length=120, blank=True)
    tags = models.CharField(max_length=255, blank=True)
    cc = models.CharField(max_length=500, blank=True)
    name = models.CharField(max_length=160, blank=True)
    email = models.EmailField(blank=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    body = models.TextField(blank=True)
    last_reply_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("status",)), models.Index(fields=("priority",)), models.Index(fields=("created_at",))]

    def __str__(self):
        return self.subject


class Contact(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="contacts")
    salutation = models.CharField(max_length=20, blank=True)
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    title = models.CharField(max_length=100, blank=True)  # Designation
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-is_primary", "first_name", "last_name")
        indexes = [
            models.Index(fields=("customer", "is_primary")),
            models.Index(fields=("email",)),
            models.Index(fields=("phone",)),
        ]

    @property
    def full_name(self):
        parts = [self.salutation, self.first_name, self.last_name]
        return " ".join(p for p in parts if p).strip() or "Unnamed Contact"

    def __str__(self):
        return f"{self.full_name} ({self.customer.name})"


class Lead(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New Lead"
        CONTACT_ATTEMPTED = "contact_attempted", "Contact Attempted"
        CONTACTED = "contacted", "Contacted"
        ENQUIRY_CREATED = "enquiry_created", "Enquiry Created"
        UNREACHABLE = "unreachable", "Unreachable"
        CUSTOMER = "customer", "Customer"

    name = models.CharField(max_length=160)
    salutation = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    company = models.CharField(max_length=160, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="India")
    zip_code = models.CharField(max_length=20, blank=True)
    source = models.CharField(max_length=100, blank=True)
    group = models.CharField(max_length=100, blank=True)
    referred_by = models.CharField(max_length=160, blank=True)
    lead_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    contacted_today = models.BooleanField(default=False)
    assigned_to = models.ForeignKey("Staff", on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_leads")
    referral_partner = models.ForeignKey("ReferralPartner", on_delete=models.SET_NULL, null=True, blank=True, related_name="leads")
    hotness = models.CharField(max_length=10, blank=True, choices=(("hot", "Hot Lead"), ("warm", "Warm Lead"), ("cold", "Cold Lead")))
    converted_customer = models.OneToOneField("Customer", on_delete=models.SET_NULL, null=True, blank=True, related_name="source_lead")
    converted_enquiry = models.OneToOneField("Enquiry", on_delete=models.SET_NULL, null=True, blank=True, related_name="source_lead")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("status",)), models.Index(fields=("created_at",))]

    def __str__(self):
        return self.name


class Enquiry(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New Enquiry"
        CONTACTED = "contacted", "Contacted"
        VISIT_SCHEDULED = "visit_scheduled", "Visit Scheduled"
        POSTPONE = "postpone", "Postpone"
        DROP = "drop", "Drop"
        VISITED = "visited", "Visited"
        QUOTED = "quoted", "Quoted"
        FOLLOW_UP = "follow_up", "Follow Up"
        WON = "won", "Won"
        LOST = "lost", "Lost"

    title = models.CharField(max_length=200)
    enquiry_type = models.CharField(max_length=100, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="enquiries")
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name="enquiries")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    contacted_person = models.CharField(max_length=160, blank=True)
    site_location = models.CharField(max_length=255, blank=True)
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_enquiries")
    referral_partner = models.ForeignKey("ReferralPartner", on_delete=models.SET_NULL, null=True, blank=True, related_name="enquiries")
    description = models.TextField(blank=True)
    date_of_visit = models.DateField(null=True, blank=True)
    conversion_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    referred_by = models.CharField(max_length=160, blank=True)
    quote_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("status",)), models.Index(fields=("created_at",))]

    def __str__(self):
        return self.title


class CalendarEvent(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    event_type = models.CharField(max_length=80, blank=True)
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="calendar_events")
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name="calendar_events")
    enquiry = models.ForeignKey(Enquiry, on_delete=models.SET_NULL, null=True, blank=True, related_name="calendar_events")
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="calendar_events")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("start_at",)
        indexes = [models.Index(fields=("start_at",)), models.Index(fields=("assigned_to",))]

    def __str__(self):
        return self.title


class Todo(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="todos")
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name="todos")
    enquiry = models.ForeignKey(Enquiry, on_delete=models.SET_NULL, null=True, blank=True, related_name="todos")
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="todos")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("completed", "due_date", "-created_at")
        indexes = [models.Index(fields=("completed", "due_date")), models.Index(fields=("assigned_to",))]

    def __str__(self):
        return self.title


class JobActivity(models.Model):
    class ActivityType(models.TextChoices):
        INSTALLATION = "installation", "Installation"
        SERVICE = "service", "Service"
        MAINTENANCE = "maintenance", "Maintenance"
        INSPECTION = "inspection", "Inspection"
        FOLLOW_UP = "follow_up", "Follow Up"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="job_activities")
    enquiry = models.ForeignKey(Enquiry, on_delete=models.SET_NULL, null=True, blank=True, related_name="job_activities")
    project = models.ForeignKey("Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="job_activities")
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="job_activities")
    followers = models.ManyToManyField(Staff, blank=True, related_name="followed_job_activities")
    billable = models.BooleanField(default=True)
    charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    repeat_every = models.CharField(max_length=40, blank=True)
    activity_type = models.CharField(max_length=30, choices=ActivityType.choices, default=ActivityType.OTHER)
    title = models.CharField(max_length=200)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("status", "due_date", "-created_at")
        indexes = [
            models.Index(fields=("status",)),
            models.Index(fields=("priority",)),
            models.Index(fields=("start_date",)),
            models.Index(fields=("due_date",)),
        ]

    def __str__(self):
        return self.title


class Quotation(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    number = models.CharField(max_length=40, unique=True)
    enquiry = models.ForeignKey(Enquiry, on_delete=models.SET_NULL, null=True, blank=True, related_name="quotations")
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="quotations")
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quotation_date = models.DateField(null=True, blank=True)
    open_till = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="quotations")
    currency = models.CharField(max_length=10, default="INR")
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    adjustment = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    client_note = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    valid_until = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.number


class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="items")
    item = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit = models.CharField(max_length=40, default="Unit")
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ("id",)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)


class ProformaInvoice(models.Model):
    number = models.CharField(max_length=40, unique=True)
    quotation = models.OneToOneField(Quotation, on_delete=models.SET_NULL, null=True, blank=True, related_name="proforma_invoice")
    enquiry = models.ForeignKey(Enquiry, on_delete=models.SET_NULL, null=True, blank=True, related_name="proforma_invoices")
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="proforma_invoices")
    invoice_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    recurring = models.BooleanField(default=False)
    recurrence_frequency = models.CharField(max_length=30, blank=True)
    cycles_remaining = models.PositiveIntegerField(null=True, blank=True)
    client_note = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)


class ProformaInvoiceItem(models.Model):
    proforma_invoice = models.ForeignKey(ProformaInvoice, on_delete=models.CASCADE, related_name="items")
    item = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit = models.CharField(max_length=40, default="Unit")
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)


class GSTInvoice(models.Model):
    number = models.CharField(max_length=40, unique=True)
    proforma_invoice = models.OneToOneField(ProformaInvoice, on_delete=models.SET_NULL, null=True, blank=True, related_name="gst_invoice")
    quotation = models.ForeignKey(Quotation, on_delete=models.SET_NULL, null=True, blank=True, related_name="gst_invoices")
    enquiry = models.ForeignKey(Enquiry, on_delete=models.SET_NULL, null=True, blank=True, related_name="gst_invoices")
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="gst_invoices")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="gst_invoices")
    invoice_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    reference_number = models.CharField(max_length=120, blank=True)
    tags = models.CharField(max_length=255, blank=True)
    sales_agent = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="gst_invoices")
    currency = models.CharField(max_length=10, default="INR")
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    adjustment = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    client_note = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default="unpaid")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)


class GSTInvoiceItem(models.Model):
    gst_invoice = models.ForeignKey(GSTInvoice, on_delete=models.CASCADE, related_name="items")
    item = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    hsn_code = models.CharField(max_length=40, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit = models.CharField(max_length=40, default="Unit")
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)


class CreditNote(models.Model):
    number = models.CharField(max_length=40, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="credit_notes")
    credit_note_date = models.DateField(null=True, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    discount_type = models.CharField(max_length=20, default="none")
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    adjustment = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reference = models.CharField(max_length=120, blank=True)
    admin_note = models.TextField(blank=True)
    client_note = models.TextField(blank=True)
    declaration = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)


class CreditNoteItem(models.Model):
    credit_note = models.ForeignKey(CreditNote, on_delete=models.CASCADE, related_name="items")
    item = models.CharField(max_length=200)
    hsn_code = models.CharField(max_length=40, blank=True)
    nos = models.CharField(max_length=40, blank=True)
    unit = models.CharField(max_length=40, default="Unit")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)


class ItemGroup(models.Model):
    name = models.CharField(max_length=120, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)


class Item(models.Model):
    name = models.CharField(max_length=200)
    item_number = models.CharField(max_length=40, unique=True, blank=True)
    description = models.TextField(blank=True)
    hsn_code = models.CharField(max_length=40, blank=True)
    sku = models.CharField(max_length=80, blank=True)
    product = models.CharField(max_length=120, blank=True)
    purchase_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    threshold = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=40, default="Unit")
    item_type = models.CharField(max_length=40, default="Service")
    purchase_unit = models.CharField(max_length=40, default="Unit")
    image = models.ImageField(upload_to="items/", null=True, blank=True)
    group = models.ForeignKey(ItemGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name="items")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)
        indexes = [models.Index(fields=("name",)), models.Index(fields=("sku",))]

    def save(self, *args, **kwargs):
        if not self.item_number:
            self.item_number = f"PRD-{self.pk or Item.objects.count() + 1:06d}"
        super().save(*args, **kwargs)


class Payment(models.Model):
    invoice = models.ForeignKey(GSTInvoice, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=40, default="bank_transfer")
    reference = models.CharField(max_length=100, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)


class AdvancePayment(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="advance_payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=40, default="cash")
    reference = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-payment_date", "-created_at")

    def __str__(self):
        return f"Advance payment {self.pk}"


class ExpenseCategory(models.Model):
    name = models.CharField(max_length=120, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)


class Expense(models.Model):
    name = models.CharField(max_length=200)
    note = models.TextField(blank=True)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name="expenses")
    expense_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    billable = models.BooleanField(default=False)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses")
    project = models.ForeignKey("Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses")
    currency = models.CharField(max_length=10, default="INR")
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_two = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=40, blank=True)
    reference = models.CharField(max_length=120, blank=True)
    repeat_every = models.CharField(max_length=40, blank=True)
    attachment = models.FileField(upload_to="expenses/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-expense_date", "-created_at")


class ActivityLog(models.Model):
    description = models.TextField()
    occurred_at = models.DateTimeField(auto_now_add=True)
    staff = models.CharField(max_length=160, blank=True)

    class Meta:
        ordering = ("-occurred_at",)


class Goal(models.Model):
    subject = models.CharField(max_length=200)
    goal_type = models.CharField(max_length=80)
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name="goals")
    achievement = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    notify_on_achievement = models.BooleanField(default=True)
    notify_on_failed = models.BooleanField(default=True)
    progress = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)


class DatabaseBackup(models.Model):
    name = models.CharField(max_length=200)
    file = models.FileField(upload_to="", storage=private_backup_storage)
    size = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
