from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from crm.models import Contact, Customer, Enquiry, Lead, Staff


class Command(BaseCommand):
    help = "Create a small repeatable development dataset for the CRM."

    def handle(self, *args, **options):
        User = get_user_model()
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@sajo.com",
                "first_name": "Sajo",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin_user.set_password("SajoCRM-Admin-2026!")
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Superuser 'admin' created with password 'SajoCRM-Admin-2026!'."))

        staff = [
            ("Asha Kumar", "Asha", "Kumar", "asha@example.test", "+91 90000 00005", "Service Manager"),
            ("Vikram Das", "Vikram", "Das", "vikram@example.test", "+91 90000 00006", "Sales Executive"),
        ]
        for name, first, last, email, phone, designation in staff:
            Staff.objects.get_or_create(
                email=email,
                defaults={"name": name, "first_name": first, "last_name": last, "phone": phone, "designation": designation},
            )

        # Seed Customers & Contacts matching the reference system
        customer_data = [
            {
                "name": "Messrs. Milestone Designs",
                "company": "Milestone Designs",
                "group": "IT / Corporate",
                "phone": "9632541212",
                "email": "milestone@gmail.com",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "country": "India",
                "is_active": True,
                "contacts": [
                    {
                        "salutation": "Mr.",
                        "first_name": "Arul Vignesh",
                        "last_name": "R",
                        "email": "arul@gmail.com",
                        "phone": "9632147963",
                        "title": "IT Director",
                        "is_primary": True,
                        "is_active": True,
                    },
                    {
                        "salutation": "Ms.",
                        "first_name": "Priya",
                        "last_name": "Sharma",
                        "email": "priya@milestone.com",
                        "phone": "9876543210",
                        "title": "Facility Manager",
                        "is_primary": False,
                        "is_active": True,
                    },
                ],
            },
            {
                "name": "Messrs. Ambika School",
                "company": "Ambika School",
                "group": "School",
                "phone": "7897897896",
                "email": "ambikaschools@gmail.com",
                "city": "Coimbatore",
                "state": "Tamil Nadu",
                "country": "India",
                "is_active": True,
                "contacts": [
                    {
                        "salutation": "Mr.",
                        "first_name": "Rajeshwaran",
                        "last_name": "R",
                        "email": "rajeshr@gmail.com",
                        "phone": "9632587412",
                        "title": "Principal",
                        "is_primary": True,
                        "is_active": True,
                    }
                ],
            },
            {
                "name": "Messrs. Tamilnadu Hotels",
                "company": "Tamilnadu Hotels",
                "group": "Hotel",
                "phone": "9321478965",
                "email": "tamilnaduhotels@gmails.com",
                "city": "Madurai",
                "state": "Tamil Nadu",
                "country": "India",
                "is_active": True,
                "contacts": [
                    {
                        "salutation": "Mr.",
                        "first_name": "Tamilnadu",
                        "last_name": "Hotels",
                        "email": "tamilnaduhotels@gmails.com",
                        "phone": "9321478965",
                        "title": "General Manager",
                        "is_primary": True,
                        "is_active": True,
                    }
                ],
            },
            {
                "name": "Messrs. Rajeev Hospital",
                "company": "Rajeev Hospital",
                "group": "Hospital",
                "phone": "9865875498",
                "email": "gunaviswas@gmail.com",
                "city": "Salem",
                "state": "Tamil Nadu",
                "country": "India",
                "is_active": True,
                "contacts": [
                    {
                        "salutation": "Mr.",
                        "first_name": "Ramu Krishna",
                        "last_name": "R",
                        "email": "rajeev@gmail.com",
                        "phone": "9652965296",
                        "title": "Operations Head",
                        "is_primary": True,
                        "is_active": True,
                    },
                    {
                        "salutation": "Dr.",
                        "first_name": "Guna",
                        "last_name": "Viswas",
                        "email": "guna@hospital.com",
                        "phone": "9845123456",
                        "title": "Medical Superintendent",
                        "is_primary": False,
                        "is_active": True,
                    },
                ],
            },
        ]

        customer_objects = []
        for cdata in customer_data:
            contacts_list = cdata.pop("contacts")
            customer, _ = Customer.objects.get_or_create(
                name=cdata["name"],
                defaults=cdata,
            )
            # Update fields if already existed
            for k, v in cdata.items():
                setattr(customer, k, v)
            customer.save()

            customer_objects.append(customer)
            for contact in contacts_list:
                Contact.objects.get_or_create(
                    customer=customer,
                    email=contact["email"],
                    defaults=contact,
                )

        leads = [
            ("Ravi Menon", "ravi@example.test", "+91 90000 00003", Lead.Status.CONTACTED),
            ("Priya Shah", "priya@example.test", "+91 90000 00004", Lead.Status.ENQUIRY_CREATED),
        ]
        for name, email, phone, status in leads:
            Lead.objects.get_or_create(
                email=email,
                defaults={"name": name, "phone": phone, "status": status},
            )

        enquiries = [
            ("Warehouse camera upgrade", customer_objects[0], Enquiry.Status.NEW),
            ("Retail branch maintenance", customer_objects[1], Enquiry.Status.VISIT_SCHEDULED),
        ]
        for title, customer, status in enquiries:
            Enquiry.objects.get_or_create(
                title=title,
                defaults={"customer": customer, "status": status},
            )

        self.stdout.write(self.style.SUCCESS("Development CRM data is ready."))
        self.stdout.write(self.style.SUCCESS("Development CRM data seeded successfully with customers and contacts."))
        self.stdout.write(self.style.SUCCESS("Development CRM data seeded successfully into MySQL."))
