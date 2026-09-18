from django.contrib import admin

from .models import CalendarEvent, Contact, Customer, Enquiry, GSTInvoice, Lead, Payment, ProformaInvoice, Quotation, Staff, Todo

admin.site.register((Customer, Contact, Lead, Enquiry, Staff, CalendarEvent, Todo, Quotation, ProformaInvoice, GSTInvoice, Payment))
