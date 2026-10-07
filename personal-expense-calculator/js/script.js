// ---------- Data ----------
const CATEGORIES = ["Food", "Transport", "Education", "Shopping", "Bills", "Entertainment", "Other"];
let income = 0;
const expenses = []; // each item: { id, name, amount, category }
let nextId = 1;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const formatMoney = (n) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

const showMessage = (el, text, ok = false) => {
  el.textContent = text;
  el.classList.toggle("ok", ok);
};

// ---------- Validation ----------
const parseAmount = (value) => {
  if (value.trim() === "") return { error: "empty" };
  const num = Number(value);
  if (Number.isNaN(num)) return { error: "invalid" };
  if (num <= 0) return { error: "notPositive" };
  return { value: num };
};

const validateExpense = (name, amountText, category) => {
  if (name.trim() === "") return "Please enter an expense name.";
  const result = parseAmount(amountText);
  if (result.error) return "Please enter a valid expense amount greater than zero.";
  if (category === "") return "Please select a category.";
  return null; // no error
};

// ---------- Calculations ----------
const calculateTotalExpenses = () => expenses.reduce((sum, e) => sum + e.amount, 0);
const calculateSavings = () => income - calculateTotalExpenses();

const calculateCategoryTotals = () => {
  const totals = {};
  CATEGORIES.forEach((c) => (totals[c] = 0));
  for (const e of expenses) totals[e.category] += e.amount;
  return totals;
};

const findHighestExpense = () =>
  expenses.length === 0 ? null : expenses.reduce((max, e) => (e.amount > max.amount ? e : max));

const findHighestCategory = (totals) => {
  let top = null;
  for (const [cat, amt] of Object.entries(totals)) {
    if (amt > 0 && (top === null || amt > totals[top])) top = cat;
  }
  return top;
};

// ---------- Actions ----------
const setIncome = (event) => {
  event.preventDefault();
  const result = parseAmount($("incomeAmount").value);
  if (result.error === "empty") return showMessage($("incomeMsg"), "Please enter your monthly income.");
  if (result.error === "invalid") return showMessage($("incomeMsg"), "Please enter a valid number.");
  if (result.error === "notPositive") return showMessage($("incomeMsg"), "Income must be greater than zero.");
  income = result.value;
  showMessage($("incomeMsg"), "Income saved.", true);
  updateDashboard();
};

const addExpense = (event) => {
  event.preventDefault();
  const name = $("expenseName").value;
  const amountText = $("expenseAmount").value;
  const category = $("expenseCategory").value;

  const error = validateExpense(name, amountText, category);
  if (error) return showMessage($("expenseMsg"), error);

  expenses.push({ id: nextId++, name: name.trim(), amount: Number(amountText), category });
  $("expenseForm").reset();
  showMessage($("expenseMsg"), "Expense added.", true);
  updateDashboard();
};

const deleteExpense = (id) => {
  const index = expenses.findIndex((e) => e.id === id);
  if (index !== -1) expenses.splice(index, 1);
  updateDashboard();
};

const resetCalculator = () => {
  if (!confirm("Are you sure you want to reset everything?")) return;
  income = 0;
  expenses.length = 0;
  $("incomeForm").reset();
  $("expenseForm").reset();
  showMessage($("incomeMsg"), "");
  showMessage($("expenseMsg"), "");
  updateDashboard();
};

// ---------- Display ----------
const displayExpenses = () => {
  const list = $("expenseList");
  list.innerHTML = "";
  if (expenses.length === 0) {
    list.innerHTML = '<li class="empty" style="display:block">No expenses added yet.</li>';
    return;
  }
  expenses.forEach((e) => {
    const li = document.createElement("li");
    const tag = Object.assign(document.createElement("span"), { className: "tag", textContent: e.category });
    const name = Object.assign(document.createElement("span"), { textContent: e.name });
    const amount = Object.assign(document.createElement("span"), { className: "amount", textContent: formatMoney(e.amount) });
    const del = Object.assign(document.createElement("button"), { textContent: "Delete" });
    del.setAttribute("aria-label", `Delete ${e.name}`);
    del.addEventListener("click", () => deleteExpense(e.id));
    li.append(tag, name, amount, del);
    list.appendChild(li);
  });
};

const displayCategories = (totals) => {
  $("categoryList").innerHTML = CATEGORIES
    .map((c) => `<li><span>${c}</span><strong>${formatMoney(totals[c])}</strong></li>`)
    .join("");
};

const generateSummary = (totalExpenses, savings, totals) => {
  const highest = findHighestExpense();
  const topCategory = findHighestCategory(totals);
  let message, cls;
  if (savings > 0) { message = "You are saving money this month."; cls = "good"; }
  else if (savings === 0) { message = "Your income has been fully utilized."; cls = "zero"; }
  else { message = "Your expenses are higher than your income."; cls = "bad"; }

  $("summary").innerHTML = `
    <p>Total income: <strong>${formatMoney(income)}</strong></p>
    <p>Total expenses: <strong>${formatMoney(totalExpenses)}</strong></p>
    <p>Total savings: <strong>${formatMoney(savings)}</strong></p>
    <p>Number of expenses: <strong>${expenses.length}</strong></p>
    <p>Highest expense: <strong></strong></p>
    <p>Highest spending category: <strong></strong></p>
    <div class="status ${cls}">${message}</div>`;
  const strongs = $("summary").querySelectorAll("strong");
  strongs[4].textContent = highest ? `${highest.name} (${formatMoney(highest.amount)})` : "N/A";
  strongs[5].textContent = topCategory ? `${topCategory} (${formatMoney(totals[topCategory])})` : "N/A";
};

const updateDashboard = () => {
  const totalExpenses = calculateTotalExpenses();
  const savings = calculateSavings();
  const totals = calculateCategoryTotals();

  $("totalIncome").textContent = formatMoney(income);
  $("totalExpenses").textContent = formatMoney(totalExpenses);
  $("totalSavings").textContent = formatMoney(savings);
  document.querySelector(".savings").classList.toggle("negative", savings < 0);

  displayExpenses();
  displayCategories(totals);
  generateSummary(totalExpenses, savings, totals);
};

// ---------- Events ----------
$("incomeForm").addEventListener("submit", setIncome);
$("expenseForm").addEventListener("submit", addExpense);
$("resetBtn").addEventListener("click", resetCalculator);
updateDashboard();
