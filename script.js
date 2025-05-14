let currentUser = null; // Tracks authenticated user
const currentYear = new Date().getFullYear();

// Load embedded mock data
const mockData = JSON.parse(document.getElementById('mockData').textContent);

// State variable for active tab
let activeTab = 'home';

// Function: Handle Tab Switching
function handleTabChange(tab) {
  console.log('handleTabChange called with:', tab); // Debug line

  const contentDiv = document.getElementById('content');
  const defaultMessage = document.getElementById('default-message');

  // Always clear previous content
  contentDiv.innerHTML = '';
  // Default: show full message unless overridden
  defaultMessage.classList.remove('dimmed', 'hidden');

  activeTab = tab;
  let hasRealContent = false;

  switch (tab) {
    case 'home':
      renderHome(contentDiv);
      hasRealContent = true;
      break;

    case 'pay':
    case 'status':
      if (!currentUser) {
        contentDiv.innerHTML = `
          <h2>Access Denied</h2>
          <p>You must be logged in to continue. 
            <a href="#" onclick="event.preventDefault(); toggleSignIn(document.getElementById('content'))">Sign in</a>
          </p>`;
        toggleSignIn(contentDiv);
      } else {
        if (tab === 'pay') {
          renderPayTaxForm(contentDiv, currentUser.id);
        } else {
          renderTaxStatus(contentDiv, currentUser.id);
        }
        hasRealContent = true;
      }
      break;

    case 'land_tax_history':
    case 'transport_tax':
    case 'sales_tax':
    case 'service_tax':
      renderGeneralTaxHistory(contentDiv, tab);
      hasRealContent = true;
      break;

    case 'certificates':
    case 'legalization':
    case 'certification':
    case 'services':
      showConstructionModal();
      defaultMessage.classList.add('dimmed');
      hasRealContent = false;
      break;

    case 'signin':
      toggleSignIn(contentDiv);
      hasRealContent = true;
      break;

    case 'full_tax_history':
      renderFullTaxHistory(container);
      hasRealContent = true;
      break;

    default:
      showConstructionModal();
      defaultMessage.classList.add('dimmed');
      hasRealContent = false;
  }

  // Only show mayor's message if no real content is shown
  if (hasRealContent || ['certificates', 'legalization', 'certification', 'services'].includes(tab)) {
    defaultMessage.classList.add('hidden');
  } else {
    defaultMessage.classList.remove('hidden');
  }

  // Hide modal unless it's an under-construction tab
  const underConstructionTabs = ['certificates', 'legalization', 'certification', 'services'];
  if (!underConstructionTabs.includes(tab)) {
    document.getElementById('construction-modal').classList.add('hidden');
  }
}

// Helper: Render General Tax History
function renderGeneralTaxHistory(container, title) {
  const taxRecords = mockData.taxation[title];
  if (!taxRecords || taxRecords.length === 0) {
    container.innerHTML = `<h2>No Records Found</h2>`;
    return;
  }

  const allTaxesHTML = taxRecords.map(record => `
    <div class="tax-record ${record.status.toLowerCase()}">
      <p><strong>Year:</strong> ${record.year}</p>
      <p><strong>Status:</strong> ${record.status}</p>
      <p><strong>Amount:</strong> ${record.amount}</p>
      <p><strong>Verified via Blockchain:</strong> ${record.blockchainVerified ? '✅ Yes' : '❌ No'}</p>
    </div>
  `).join('');

  container.innerHTML = `
    <h2>${title.replace('_', ' ').toUpperCase()} History</h2>
    <div class="tax-list">${allTaxesHTML}</div>
  `;
}

// Function: Render Full Tax History
function renderFullTaxHistory(container) {
  const sections = Object.keys(mockData.taxation);
  let html = `<h2>Full Tax History</h2>`;
  sections.forEach(section => {
    const records = mockData.taxation[section];
    html += `<h3>${section.toUpperCase()}</h3>`;
    html += `<ul>`;
    html += records.map(record => `
      <li class="tax-record ${record.status.toLowerCase()}">
        <p><strong>Year:</strong> ${record.year}</p>
        <p><strong>Status:</strong> ${record.status}</p>
        <p><strong>Amount:</strong> ${record.amount}</p>
        <p><strong>Verified via Blockchain:</strong> ${record.blockchainVerified ? '✅ Yes' : '❌ No'}</p>
      </li>
    `).join('');
    html += `</ul>`;
  });
  container.innerHTML = html;
}

// Function: Render Home Page
function renderHome(container) {
  container.innerHTML = `
    <h2>Message from the Mayor</h2>
    <p>Welcome to NdaY'Ben'Tanàna, the platform transforming governance in Madagascar. We are committed to transparency, inclusion, and innovation. Explore our services to simplify your civic duties and empower your community.</p>
  `;
}

// Function: Render Payment Form
function renderPayTaxForm(container, userId) {
  const userRecords = mockData.userTaxRecords[userId] || [];
  const unpaidRecords = userRecords.filter(record => !record.paid && parseInt(record.year) < currentYear);

  if (unpaidRecords.length === 0) {
    container.innerHTML = `
      <h2>No Unpaid Taxes</h2>
      <p>You have no unpaid land taxes from previous years.</p>
    `;
    return;
  }

  if (unpaidRecords.length === 1) {
    const record = unpaidRecords[0];
    container.innerHTML = `
      <h2>Pay Land Tax</h2>
      <form id="pay-tax-form">
        <label>Plot Number:</label>
        <input type="text" value="${record.plotNumber}" readonly>
        <label>Year:</label>
        <input type="text" value="${record.year}" readonly>
        <label>Amount Due:</label>
        <input type="text" value="${record.amount}" readonly>
        <button type="submit">Pay Now</button>
      </form>
    `;
  } else {
    container.innerHTML = `
      <h2>Select a Land Tax to Pay</h2>
      <form id="pay-tax-form">
        <label for="taxRecordSelect">Unpaid Taxes:</label>
        <select id="taxRecordSelect">
          ${unpaidRecords.map(rec => `
            <option value="${rec.id}">
              Plot: ${rec.plotNumber} | Year: ${rec.year} | Amount: ${rec.amount}
            </option>
          `).join('')}
        </select><br><br>
        <button type="submit">Proceed to Payment</button>
      </form>
    `;
  }

  document.getElementById('pay-tax-form').addEventListener('submit', function (e) {
    e.preventDefault();
    let selectedRecord = null;
    if (unpaidRecords.length === 1) {
      selectedRecord = unpaidRecords[0];
    } else {
      const selectedId = document.getElementById('taxRecordSelect').value;
      selectedRecord = unpaidRecords.find(r => r.id === selectedId);
    }

    if (selectedRecord) {
      showGeneralPaymentForm(container, selectedRecord);
    }
  });
}

// Unified Generalized Payment Form
function showGeneralPaymentForm(container, record) {
  container.innerHTML = `
    <h2>Confirm Land Tax Payment</h2>
    <form id="payment-form">
      <!-- Static Info -->
      <div class="form-group">
        <label for="plotNumber">Land Reference (Plot Number):</label>
        <input type="text" id="plotNumber" value="${record.plotNumber}" readonly>
      </div>

      <div class="form-group">
        <label for="year">Year:</label>
        <input type="text" id="year" value="${record.year}" readonly>
      </div>

      <div class="form-group">
        <label for="amount">Amount to Pay:</label>
        <input type="text" id="amount" value="${record.amount}" readonly>
      </div>

      <!-- Payment Method Selection -->
      <div class="form-group">
        <label for="paymentMethod">Choose Payment Method:</label>
        <select id="paymentMethod" required>
          <option value="">-- Select Payment Method --</option>
          <option value="orange_money">Orange Money</option>
          <option value="mvola">Mvola</option>
          <option value="airtel_money">Airtel Money</option>
          <option value="credit_card">Credit Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="other">Other Online Payment</option>
        </select>
      </div>

      <!-- Conditional Fields Based on Method -->
      <div id="conditional-fields" class="hidden"></div>

      <!-- Receipt Upload (Optional) -->
      <div class="form-group">
        <label for="receiptUpload">Attach Receipt (Optional):</label>
        <input type="file" id="receiptUpload" accept="image/*, .pdf">
      </div>

      <button type="submit">Proceed to Verification</button>
    </form>
  `;

  const paymentMethodSelect = document.getElementById('paymentMethod');
  const conditionalFields = document.getElementById('conditional-fields');

  // Dynamically update form based on selected method
  paymentMethodSelect.addEventListener('change', () => {
    conditionalFields.classList.remove('hidden');
    conditionalFields.innerHTML = '';

    const method = paymentMethodSelect.value;

    switch (method) {
      case 'orange_money':
      case 'mvola':
      case 'airtel_money':
        conditionalFields.innerHTML = `
          <div class="form-group">
            <label for="senderPhone">Sender Phone Number:</label>
            <input type="tel" id="senderPhone" placeholder="e.g., 0341234567" pattern="[0-9]{10}" required>
          </div>
          <div class="form-group">
            <label for="transactionRef">Transaction Reference:</label>
            <input type="text" id="transactionRef" placeholder="Enter reference code" required>
          </div>
          <div class="form-group">
            <label for="transactionDate">Transaction Date & Time:</label>
            <input type="text" id="transactionDate" placeholder="e.g., 12/25/2024 14:30:00" required>
          </div>
        `;
        break;

      case 'credit_card':
        conditionalFields.innerHTML = `
          <div class="form-group">
            <label for="cardNumber">Card Number:</label>
            <input type="text" id="cardNumber" placeholder="e.g., 4242 4242 4242 4242" required>
          </div>
          <div class="form-group">
            <label for="cardExpiry">Card Expiry (MM/YY):</label>
            <input type="text" id="cardExpiry" placeholder="e.g., 12/25" required>
          </div>
          <div class="form-group">
            <label for="cardCvv">CVV:</label>
            <input type="password" id="cardCvv" placeholder="e.g., 123" required>
          </div>
        `;
        break;

      case 'bank_transfer':
        const municipalAccount = mockData.municipalBankAccounts.general_tax_account;

        conditionalFields.innerHTML = `
          <div class="form-group">
            <label for="senderAccount">Sender Bank Account:</label>
            <input type="text" id="senderAccount" placeholder="e.g., MA0010000012345678901234" pattern="[A-Z0-9]{24}" required>
          </div>
          <div class="form-group">
            <label for="recipientAccount">Recipient (Municipal) Account:</label>
            <input type="text" id="recipientAccount" value="${municipalAccount}" readonly>
          </div>
          <div class="form-group">
            <label for="transferDate">Transfer Date & Time (MD/DD/YYYY HH:MM:SS):</label>
            <input type="text" id="transferDate" placeholder="e.g., 12/25/2024 14:30:00" required>
          </div>
        `;
        break;

      case 'other':
        conditionalFields.innerHTML = `
          <p>Please complete this transaction using your preferred method.</p>
        `;
        break;

      default:
        conditionalFields.classList.add('hidden');
    }
  });

  // Handle form submission
  document.getElementById('payment-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const method = paymentMethodSelect.value;
    const receiptFile = document.getElementById('receiptUpload').files[0];

    if (!method.trim()) {
      alert("Please select a payment method.");
      return;
    }

    let senderPhone, transactionRef, cardNumber, transferDate;

    if (['orange_money', 'mvola', 'airtel_money'].includes(method)) {
      senderPhone = document.getElementById('senderPhone').value;
      transactionRef = document.getElementById('transactionRef').value;

      if (!senderPhone || !transactionRef) {
        alert("Please fill in all highlighted fields.");
        return;
      }
    }

    if (method === 'credit_card') {
      cardNumber = document.getElementById('cardNumber').value;
      if (!cardNumber) {
        alert("Card number is required.");
        return;
      }
    }

    if (method === 'bank_transfer') {
      transferDate = document.getElementById('transferDate').value;
      const senderAccount = document.getElementById('senderAccount').value;
      const recipientAccount = document.getElementById('recipientAccount').value;

      if (!senderAccount || !recipientAccount || !transferDate) {
        alert("Please fill in all highlighted fields.");
        return;
      }

      if (!mockData.bankReceiptValidationRules.allowedBankAccounts.includes(recipientAccount)) {
        alert("Invalid recipient account number.");
        return;
      }

      // Simulate amount match check
      const expectedAmount = parseInt(record.amount.replace(/[^0-9]/g, ''));
      const fakeScannedReceiptAmount = expectedAmount;
      const tolerance = mockData.bankReceiptValidationRules.amountTolerance;

      if (Math.abs(expectedAmount - fakeScannedReceiptAmount) > tolerance) {
        alert(`The transferred amount does not match the expected amount (within ±Ar${tolerance}).`);
        return;
      }
    }

    // Mark as paid and simulate finance unit approval
    record.paid = true;
    simulateFinanceVerification(container, record, method, receiptFile);
  });
}

// Function: Simulate Finance Unit Approval
function simulateFinanceVerification(container, record, method, receiptFile) {
  container.innerHTML = `
    <div class="success-message">
      <h2>⏳ Waiting for Finance Unit Approval</h2>
      <p><strong>Verifying transaction...</strong></p>
    </div>
  `;

  // Simulate backend delay
  setTimeout(() => {
    const approved = Math.random() > 0.2; // 80% success rate

    if (approved) {
      renderPaymentSuccess(container, record, method, receiptFile);
    } else {
      container.innerHTML = `
        <div class="success-message" style="background-color: #f8d7da; color: #721c24;">
          <h2>❌ Payment Rejected</h2>
          <p>Could not verify transaction. Please try again.</p>
          <button onclick="handleTabChange('pay')">Try Again</button>
        </div>
      `;
    }
  }, 2000);
}

// Helper: Render Payment Success Screen
function renderPaymentSuccess(container, record, method, receiptFile) {
  const methodName = {
    orange_money: "Orange Money",
    mvola: "Mvola",
    airtel_money: "Airtel Money",
    credit_card: "Credit Card",
    bank_transfer: "Bank Transfer",
    other: "Other Online Payment"
  }[method] || "Unknown Method";

  let paymentDetails = '';
  if (['orange_money', 'mvola', 'airtel_money', 'credit_card', 'bank_transfer'].includes(method)) {
    paymentDetails = `
      <p><strong>Payment Method:</strong> ${methodName}</p>
    `;
  }

  container.innerHTML = `
    <div class="success-message">
      <h2>✅ Payment Verified by Finance Unit</h2>
      <p><strong>Plot Number:</strong> ${record.plotNumber}</p>
      <p><strong>Year:</strong> ${record.year}</p>
      <p><strong>Amount Paid:</strong> ${record.amount}</p>
      ${paymentDetails}
      <p><strong>Status:</strong> Confirmed via Municipal Finance Department</p>
      <p><strong>Transaction ID:</strong> ${record.id}</p>
      <button onclick="handleTabChange('status')">View Updated Tax Status</button>
    </div>
  `;

  // Show receipt preview if uploaded
  if (receiptFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
      container.insertAdjacentHTML('beforeend', `<img src="${e.target.result}" style="max-width: 100%; margin-top: 20px;" />`);
    };
    reader.readAsDataURL(receiptFile);
  }
}

// Function: Render Tax Status
function renderTaxStatus(container, userId) {
  const userRecords = mockData.userTaxRecords[userId] || [];

  if (userRecords.length === 0) {
    container.innerHTML = `<h2>No Tax Records Found</h2><p>You have no land tax records available.</p>`;
    return;
  }

  const allTaxesHTML = userRecords.map(record => `
    <div class="tax-record ${record.paid ? 'paid' : 'unpaid'}">
      <p><strong>Plot Number:</strong> ${record.plotNumber}</p>
      <p><strong>Year:</strong> ${record.year}</p>
      <p><strong>Status:</strong> ${record.paid ? 'Paid' : 'Unpaid'}</p>
      <p><strong>Amount:</strong> ${record.amount}</p>
      ${record.paid ? `<p><strong>Verified:</strong> Yes</p>` : ''}
    </div>
  `).join('');

  container.innerHTML = `<h2>Your Tax Status</h2><div class="tax-list">${allTaxesHTML}</div>`;
}

// Function: Sign-In Form
function toggleSignIn(container) {
  container.innerHTML = ''; // Clear any previous content

  const mockUsers = [
    { id: 'admin', name: 'Admin User', password: 'password' },
    { id: 'user1', name: 'Rakoto Lekely', password: 'password' },
    { id: 'user2', name: 'Ravao Bodo', password: 'password' },
    { id: 'guest', name: 'Mpitsidika', password: '' }
  ];

  const userOptions = mockUsers.map(user => `<option value="${user.id}">${user.name}</option>`).join('');

  container.innerHTML = `
    <h2>Sign In</h2>
    <form id="signin-form">
      <label for="userId">User:</label>
      <select id="userId" name="userId">
        <option value="" disabled selected>Select a user</option>
        ${userOptions}
      </select><br><br>
      <label for="password">Password:</label>
      <input type="password" id="password" placeholder="Enter Password"><br><br>
      <button type="submit">Sign In</button>
    </form>
  `;

  document.getElementById('signin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const user = mockUsers.find(u => u.id === userId);

    if (!user) return alert('User not found!');
    if (user.password === '' || user.password === password) {
      currentUser = user;
      updateAuthButton();
      showToast(`Welcome, ${user.name}!`);
      handleTabChange(activeTab);
    } else {
      alert('Invalid Credentials');
    }
  });
}

// Update Auth Button
function updateAuthButton() {
  const authBtnContainer = document.getElementById('auth-button');
  if (currentUser) {
    authBtnContainer.innerHTML = `
      <button style="background-color: #ff4d4d;" onclick="event.preventDefault(); currentUser = null; updateAuthButton(); showToast('Signed out successfully');">
        Sign Out (${currentUser.name})
      </button>
    `;
  } else {
    authBtnContainer.innerHTML = `
      <button onclick="event.preventDefault(); toggleSignIn(document.getElementById('content'))">
        Sign In
      </button>
    `;
  }
}

// Toast Notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Modal Functions
function showConstructionModal() {
  const modal = document.getElementById('construction-modal');
  modal.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideConstructionModal() {
  const modal = document.getElementById('construction-modal');
  modal.classList.add('hidden');
}

// Attach event listeners after DOM loads
document.addEventListener('DOMContentLoaded', function () {
  // Attach click handlers to all menu buttons
  document.querySelectorAll('#menu button[data-tab]').forEach(button => {
    button.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      handleTabChange(tab);
    });
  });

  // Hover effects only on non-dropdown-trigger buttons
  document.querySelectorAll('#menu button[data-tab]').forEach(button => {
    button.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      handleTabChange(tab);
    button.addEventListener('mouseenter', () => {
      const tab = button.getAttribute('data-tab');
      const defaultMessage = document.getElementById('default-message');

    if (defaultMessage && !['certificates', 'legalization', 'certification', 'services'].includes(tab)) {
      defaultMessage.classList.remove('dimmed', 'hidden');
      }
    });
    button.addEventListener('mouseleave', () => {
      const tab = button.getAttribute('data-tab');
    const defaultMessage = document.getElementById('default-message');

    if (defaultMessage && ['certificates', 'legalization', 'certification', 'services'].includes(tab)) {
      defaultMessage.classList.add('dimmed');
    }
    });
  });

  // Initialize default view
  handleTabChange(activeTab);
});
  updateAuthButton();
});
