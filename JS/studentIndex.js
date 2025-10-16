document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user || user.type !== "student") {
    alert("Unauthorized access");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("name").innerText = `Welcome, ${user.name}`;

  loadSubmitForm(user.id);
  setupHistoryFilter(user.id);
  setupDownloadFilter(user.id);
});

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

const user = JSON.parse(localStorage.getItem("loggedInUser"));

fetch(`https://json-server-api-3-xhbm.onrender.com/fees?studentId=${user.id}`)
  .then(res => res.json())
  .then(fees => {
    console.log("Fees:", fees);

    const total = fees.reduce((acc, f) => acc + f.total, 0);
    const paid = fees.reduce((acc, f) => acc + f.paid, 0);
    const due = fees.reduce((acc, f) => acc + f.due, 0);

    document.getElementById("total").innerText = `Total Fees: ₹${total}`;
    document.getElementById("outstanding").innerText = `Outstanding: ₹${due}`;

    const nextDue = fees.find(f => f.due > 0);
    if (nextDue) {
      document.getElementById("upcoming").innerText = `Next Due: ₹${nextDue.due} by ${nextDue.dueDate}`;
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user || user.type !== "student") {
    alert("Unauthorized access");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("name").innerText = `Welcome, ${user.name}`;

  loadSubmitForm(user.id);
  setupHistoryFilter(user.id);
  setupDownloadFilter(user.id);
});

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

function loadSubmitForm(userId) {
  fetch(`https://json-server-api-3-xhbm.onrender.com/fees?studentId=${userId}`)
    .then(res => res.json())
    .then(data => {
      const formContainer = document.getElementById("submit-form");
      formContainer.innerHTML = "";

      const dueFees = data.filter(fee => fee.status !== "Paid");

      if (dueFees.length === 0) {
        formContainer.innerHTML = "<p>No dues to submit.</p>";
        return;
      }

      dueFees.forEach(fee => {
        const div = document.createElement("div");
        div.className = "due-box";
        div.innerHTML = `
          <h2>${fee.semester}</h2>
          <p><b>Total Fee:</b> ₹${fee.total}</p>
          <p><b>Paid: </b>₹${fee.paid}</p>
          <p><b>Due: </b>₹${fee.due}</p>
          <button class="logout" onclick="openPaymentModal(${fee.id}, '${fee.semester}', ${fee.paid}, ${fee.total})">Pay Now</button>
        `;
        formContainer.appendChild(div);
      });
    });
}
function openPaymentModal(feeId, semester, paid, total) {
  document.getElementById("feeId").value = feeId;
  document.getElementById("semester").value = semester;
  document.getElementById("alreadyPaid").value = paid;
  document.getElementById("totalFee").value = total;

  document.getElementById("modal-title").innerText = `Pay Fees - ${semester}`;
  document.getElementById("modal-total").innerText = `Total Fee: ₹${total}`;
  document.getElementById("modal-due").innerText = `Due: ₹${total - paid}`;

  document.getElementById("amountPaid").value = "";
  document.getElementById("utr").value = "";
  document.getElementById("payment-modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("payment-modal").style.display = "none";
}
async function submitPayment(e) {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  const feeId = parseInt(document.getElementById("feeId").value);
  const semester = document.getElementById("semester").value;
  const alreadyPaid = parseInt(document.getElementById("alreadyPaid").value);
  const totalFee = parseInt(document.getElementById("totalFee").value);
  const amount = parseInt(document.getElementById("amountPaid").value);
  const utr = document.getElementById("utr").value.trim();
  const today = new Date().toISOString().split("T")[0];

  if (!utr || isNaN(amount) || amount <= 0 || amount > (totalFee - alreadyPaid)) {
    alert("Please enter a valid amount and UTR.");
    return;
  }

  const newPaid = alreadyPaid + amount;
  const newDue = totalFee - newPaid;
  const newStatus = newDue === 0 ? "Paid" : "Partial";

  try {
    // Log the payment
    await fetch("https://json-server-api-3-xhbm.onrender.com/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: user.id,
        semester: semester,
        amount: amount,
        utr: utr,
        date: today
      })
    });

    // Update the fee record
    const updateRes = await fetch(`https://json-server-api-3-xhbm.onrender.com/fees/${feeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paid: newPaid,
        due: newDue,
        status: newStatus,
        dueDate: newDue > 0 ? today : null
      })
    });

    if (updateRes.ok) {
      alert("✅ Payment submitted successfully!");
      closeModal();

      // Refresh the updated fee list
      loadSubmitForm(user.id);

      // Optionally clear the form fields
      document.getElementById("amountPaid").value = "";
      document.getElementById("utr").value = "";
    } else {
      alert("❌ Failed to update fee record.");
    }
  } catch (err) {
    alert("❌ Error submitting payment.");
    console.error(err);
  }
}

function setupHistoryFilter(userId) {
  const select = document.getElementById("filter1");

  select.addEventListener("change", () => {
    const sem = select.value;
    if (sem === "Select Semester") return;

    fetch(`https://json-server-api-3-xhbm.onrender.com/payments?studentId=${userId}&semester=${sem}`)
      .then(res => res.json())
      .then(data => {
        const table = document.getElementById("history-table");
        table.innerHTML = "";

        if (data.length === 0) {
          table.innerHTML = "<p>No payments found for this semester.</p>";
        } else {
          data.forEach(p => {
            const div = document.createElement("div");
            div.className = "payment-item";
            div.innerHTML = `
              <p><strong>Date:</strong> ${p.date}</p>
              <p><strong>Amount:</strong> ₹${p.amount}</p>
              <p><strong>UTR:</strong> ${p.utr}</p>
            `;
            table.appendChild(div);
          });
        }
      });
  });
}

function setupDownloadFilter(userId) {
  const select = document.getElementById("filter2");
  
  // Add loading state
  const originalText = select.nextElementSibling.textContent;
  const loadingElement = select.nextElementSibling;

  select.addEventListener("change", async () => {
    const sem = select.value;
    if (sem === "Select Semester") return;

    try {
      loadingElement.textContent = "Loading...";
      
      const response = await fetch(`https://json-server-api-3-xhbm.onrender.com/receipts?studentId=${userId}&semester=${sem}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        alert("❌ No receipt available for this semester.");
      } else {
        // Find the most recent verified receipt
        const verifiedReceipt = data.find(r => r.status === "verified") || data[0];
        
        // Open in new tab with noreferrer for security
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = verifiedReceipt.receiptUrl;
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
      alert("⚠️ Failed to fetch receipt. Please try again later.");
    } finally {
      loadingElement.textContent = originalText;
    }
  });
}
