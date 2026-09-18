import { useEffect, useMemo, useState } from "react";
import api from "../api";

const unwrap = (response) => response.data.results || response.data;
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function ExpensesVsIncomePage() {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/expenses/"), api.get("/payments/"), api.get("/proforma-invoices/")]).then(([expenseResponse, paymentResponse, invoiceResponse]) => {
      setExpenses(unwrap(expenseResponse));
      const paymentRows = unwrap(paymentResponse);
      const invoices = unwrap(invoiceResponse);
      setPayments([...paymentRows, ...invoices.filter((invoice) => Number(invoice.amount_paid || 0) > 0).map((invoice) => ({ payment_date: invoice.invoice_date, amount: invoice.amount_paid }))]);
    }).catch(() => setError("Unable to load expenses versus income data."));
  }, []);
  const values = useMemo(() => months.map((month, index) => {
    const income = payments.filter((payment) => payment.payment_date?.startsWith(`${year}-${String(index + 1).padStart(2, "0")}`)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const expense = expenses.filter((item) => item.expense_date?.startsWith(`${year}-${String(index + 1).padStart(2, "0")}`)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { month, income, expense };
  }), [expenses, payments, year]);
  const maximum = Math.max(...values.map((value) => Math.max(value.income, value.expense)), 1);
  const currency = (value) => `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  return <section className="expenses-income-page"><div className="panel expenses-income-panel"><div className="expenses-income-toolbar"><p>Amount is displayed in your base currency - Only use this report if you are using 1 currency for payments and expenses.</p><label>Year<select value={year} onChange={(event) => setYear(event.target.value)}><option>{new Date().getFullYear()}</option><option>{new Date().getFullYear() - 1}</option><option>{new Date().getFullYear() - 2}</option></select></label></div>{error && <p className="error-message">{error}</p>}<div className="income-legend"><span className="income-key" /> Total Income <span className="expense-key" /> Expenses</div><div className="income-chart" style={{ backgroundSize: `100% ${100 / 7}%` }}>{values.map((value) => <div className="income-column" key={value.month}><div className="income-bars"><span className="income-bar" title={`${value.month}: ${currency(value.income)}`} style={{ height: `${value.income / maximum * 100}%` }} /><span className="expense-bar" title={`${value.month}: ${currency(value.expense)}`} style={{ height: `${value.expense / maximum * 100}%` }} /></div><small>{value.month}</small></div>)}</div></div></section>;
}
