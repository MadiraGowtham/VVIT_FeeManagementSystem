document.addEventListener("DOMContentLoaded", () => {
    const admin = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!admin || admin.type !== "admin") {
        alert("Unauthorized access!");
        window.location.href = "index.html";
        return;
    }

    document.getElementById("name").innerText = `Welcome, ${admin.username}`;
    loadFeeStats();

    setupBranchSelector("branch1", "students1");
    setupBranchSelector("branch2", "students2");
});

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

async function loadFeeStats() {
    const [feesRes, paymentsRes, usersRes] = await Promise.all([
        fetch("https://json-server-api-3-xhbm.onrender.com/fees"),
        fetch("https://json-server-api-3-xhbm.onrender.com/payments"),
        fetch("https://json-server-api-3-xhbm.onrender.com/users?type=student")
    ]);

    const fees = await feesRes.json();
    const payments = await paymentsRes.json();
    const students = await usersRes.json();

    const totalStudents = students.length;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const collectedThisMonth = payments
        .filter(p => p.date.slice(0, 7) === thisMonth)
        .reduce((sum, p) => sum + p.amount, 0);

    const dueByStudent = {};
    fees.forEach(f => {
        if (!dueByStudent[f.studentId]) dueByStudent[f.studentId] = 0;
        dueByStudent[f.studentId] += f.due;
    });

    const defaulterCount = Object.values(dueByStudent).filter(due => due > 0).length;

    document.getElementById("total").innerText = `Total Students: ${totalStudents}`;
    document.getElementById("upcoming").innerText = `Collected This Month: ₹${collectedThisMonth}`;
    document.getElementById("outstanding").innerText = `Defaulters: ${defaulterCount}`;
}

async function setupBranchSelector(branchId, studentDivId) {
    const branchSelect = document.getElementById(branchId);
    const studentContainer = document.getElementById(studentDivId);

    branchSelect.addEventListener("change", async () => {
        const selectedBranch = branchSelect.value;
        studentContainer.innerHTML = "";

        if (selectedBranch === "Select Branch") return;

        try {
            const res = await fetch("https://json-server-api-3-xhbm.onrender.com/users?type=student");
            const allStudents = await res.json();

            const filtered = allStudents.filter(stu => stu.branch === selectedBranch);

            if (filtered.length === 0) {
                studentContainer.innerHTML = "<p>No students in this branch.</p>";
                return;
            }

            const select = document.createElement("select");
            select.id = studentDivId === "students1" ? "studentSelect1" : "studentSelect2";
            select.innerHTML = `<option value="">Select Student</option>`;

            filtered.forEach(student => {
                const option = document.createElement("option");
                option.value = student.id;
                option.textContent = `${student.name} (${student.id})`;
                select.appendChild(option);
            });

            studentContainer.appendChild(select);

            if (studentDivId === "students2") {
                const semesterContainer = document.getElementById("semesters2");
                semesterContainer.innerHTML = "";

                select.addEventListener("change", () => {
                    semesterContainer.innerHTML = "";
                    if (select.value === "") return;

                    const semesterSelect = document.createElement("select");
                    semesterSelect.id = "semesterSelect";
                    semesterSelect.innerHTML = `
                        <option value="">Select Semester</option>
                        <option value="1-1">1-1</option>
                        <option value="1-2">1-2</option>
                        <option value="2-1">2-1</option>
                        <option value="2-2">2-2</option>
                        <option value="3-1">3-1</option>
                        <option value="3-2">3-2</option>
                        <option value="4-1">4-1</option>
                        <option value="4-2">4-2</option>
                    `;
                    semesterContainer.appendChild(semesterSelect);
                });
            }

        } catch (err) {
            console.error("Error fetching students:", err);
            alert("Error loading students.");
        }
    });
}

async function downloadReceipt() {
    const studentSelect = document.getElementById("studentSelect2");
    const semSelect = document.getElementById("semesterSelect");

    if (!studentSelect || !studentSelect.value) {
        alert("Please select a student.");
        return;
    }

    if (!semSelect || !semSelect.value || semSelect.value === "Select Semester") {
        alert("Please select a semester.");
        return;
    }

    const studentId = studentSelect.value.trim(); // Use string-based ID like "22BQ1A5489"
    const semester = semSelect.value.trim();

    const loadingElement = semSelect.nextElementSibling;
    const originalText = loadingElement ? loadingElement.textContent : null;
    if (loadingElement) loadingElement.textContent = "Loading...";

    try {
        console.log(`Fetching for studentId=${studentId}, semester=${semester}`);
        const res = await fetch(`https://json-server-api-3-xhbm.onrender.com/receipts?studentId=${studentId}&semester=${semester}`);
        const receipts = await res.json();
        console.log("Receipts fetched:", receipts);

        if (receipts.length === 0) {
            alert("❌ No receipt available for this semester.");
            return;
        }

        const verifiedReceipt = receipts.find(r => r.status === "verified") || receipts[0];

        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = verifiedReceipt.receiptUrl;

    } catch (err) {
        console.error("⚠️ Error fetching receipt:", err);
        alert("⚠️ Failed to fetch receipt. Please try again later.");
    } finally {
        if (loadingElement && originalText) loadingElement.textContent = originalText;
    }
}

async function uploadReceipt() {
    const select = document.getElementById("studentSelect1");
    const branch = document.getElementById("branch1");
    if (!select || select.value === "Select Student") {
        alert("Please select a student.");
        return;
    }

    const studentId = select.value;
    const branchId = branch.value;
    const upload = document.getElementById("upload");

    const div = document.createElement("div");
    div.className = "container";
    div.innerHTML = `
        <span class="close" onclick="closeModal()">&times;</span>
        <form>
          <div class="ID">${studentId}</div>
          <div class="branchID">${branchId}</div>
          <div class="form-group">
            <input type="text" placeholder="Enter semester">
            <input type="file" id="file" accept="image/*,application/pdf">
          </div>
          <button type="submit" onclick="submitReceipt(event)">Submit</button>
        </form>`;
    upload.appendChild(div);
    upload.style.display = "block";
}

function closeModal() {
    document.getElementById("upload").style.display = "none";
    document.getElementById("upload").innerHTML = "";
}

function submitReceipt(event) {
    event.preventDefault();

    const studentId = document.querySelector(".ID").textContent.trim();
    const branchId = document.querySelector(".branchID").textContent.trim();
    const semester = document.querySelector("input[type='text']").value.trim();
    const fileInput = document.getElementById("file");
    const file = fileInput.files[0];

    if (!semester || !file) {
        alert("Please enter semester and upload a file.");
        return;
    }

    const receiptUrl = `receipts/${file.name}`;

    fetch(`https://json-server-api-3-xhbm.onrender.com/users/${studentId}`)
        .then(res => {
            if (!res.ok) throw new Error("Student not found");
            return res.json();
        })
        .then(user => {
            const newResource = {
                studentId: parseInt(studentId),
                name: user.name,
                branch: branchId,
                semester: semester,
                receiptUrl: receiptUrl,
                status: "verified",
                date: new Date().toISOString()
            };

            return fetch("https://json-server-api-3-xhbm.onrender.com/receipts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newResource)
            });
        })
        .then(response => {
            if (!response.ok) throw new Error("Failed to save receipt");
            alert("Receipt submitted successfully!");
            closeModal();
        })
        .catch(error => {
            console.error("Error submitting receipt:", error);
            alert("Error submitting receipt.");
        });
}
