let currentUser = null; // Tracks authenticated user
const currentYear = new Date().getFullYear();

// Load embedded mock data
const mockData = JSON.parse(document.getElementById('mockData').textContent);

// State variable for active tab
let activeTab = 'home';

// Function: Handle Tab Switching
function handleTabChange(tab) {
  const contentDiv = document.getElementById('content');
  const defaultMessage = document.getElementById('default-message');

  // Clear previous content
  contentDiv.innerHTML = '';

  // Default: hide mayor's message unless overridden
  defaultMessage.classList.add('hidden');

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
          </p>
        `;
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

    case 'certificates':
    case 'legalization':
    case 'certification':
    case 'services':
      // Show modal and scroll to it
      showConstructionModal();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      hasRealContent = false;
      break;

    case 'signin':
      toggleSignIn(contentDiv);
      hasRealContent = true;
      break;

    default:
      showConstructionModal();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      hasRealContent = false;
  }

  // Only show mayor's message if no real content is shown
  if (hasRealContent || ['certificates', 'legalization', 'certification', 'services'].includes(tab)) {
    defaultMessage.classList.add('hidden');
  } else {
    defaultMessage.classList.remove('hidden');
  }

  // Always hide construction modal after handling tab change
  document.getElementById('construction-modal').classList.add('hidden');
}

// Function: Render Home Page
function renderHome(container) {
  container.innerHTML = `
    <h2>Message from the Mayor</h2>
    <p>Welcome to NdaY'Ben'Tanàna, the platform transforming governance in Madagascar...</p>
  `;
  document.getElementById('default-message').classList.remove('hidden');
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

  let selectedRecord = null;

  if (unpaidRecords.length === 1) {
    selectedRecord = unpaidRecords[0];
    showPaymentForm(container, selectedRecord);
  } else {
    container.innerHTML = `
      <h2>Select a Land Tax to Pay</h2>
      <form id="tax-record-form">
        <label for="taxRecordSelect">Unpaid Taxes:</label>
        <select id="taxRecordSelect" required>
          ${unpaidRecords.map(rec => `
            <option value="${rec.id}">
              Plot: ${rec.plotNumber} | Year: ${rec.year} | Amount: ${rec.amount}
            </option>
          `).join('')}
        </select>
        <br><br>
        <button type="submit">Proceed to Payment</button>
      </form>
    `;

    document.getElementById('tax-record-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const selectedId = document.getElementById('taxRecordSelect').value;
      selectedRecord = unpaidRecords.find(r => r.id === selectedId);
      if (selectedRecord) {
        showPaymentForm(container, selectedRecord);
      }
    });
  }
}

// Helper: Display the actual payment form
function showPaymentForm(container, record) {
  container.innerHTML = `
    <h2>Confirm Land Tax Payment</h2>
    <form id="payment-form">
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

      <div class="form-group">
        <label for="phoneNumber">Phone Number (for mobile money):</label>
        <input type="tel" id="phoneNumber" placeholder="Enter phone number" pattern="[0-9]{10}" required>
      </div>

      <button type="submit">Confirm & Pay</button>
    </form>
  `;

  // Handle form submission
  document.getElementById('payment-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const method = document.getElementById('paymentMethod').value;
    const phone = document.getElementById('phoneNumber').value;

    if (!method) {
      alert("Please select a payment method.");
      return;
    }

    if ((method.includes("money")) && (!phone || phone.length !== 10)) {
      alert("Please enter a valid 10-digit phone number for mobile payments.");
      return;
    }

    // Simulate successful payment
    record.paid = true;
    renderPaymentSuccess(container, record, method, phone);
  });
}

function renderPaymentSuccess(container, record, method, phone) {
  const paymentMethods = {
    orange_money: "Orange Money",
    mvola: "Mvola",
    airtel_money: "Airtel Money",
    credit_card: "Credit Card",
    bank_transfer: "Bank Transfer",
    other: "Other Online Payment"
  };

  const methodName = paymentMethods[method] || "Unknown Method";

  container.innerHTML = `
    <div class="success-message">
      <h2>✅ Payment Successful!</h2>
      <p><strong>Plot Number:</strong> ${record.plotNumber}</p>
      <p><strong>Year:</strong> ${record.year}</p>
      <p><strong>Amount Paid:</strong> ${record.amount}</p>
      <p><strong>Payment Method:</strong> ${methodName}</p>
      ${phone ? `<p><strong>Mobile Number Used:</strong> ${phone}</p>` : ''}
      <p><strong>Transaction ID:</strong> ${record.id}</p>
      <p><strong>Blockchain Verified:</strong> Yes</p>
      <button onclick="handleTabChange('status')">View Updated Tax Status</button>
    </div>
  `;
}

// Function: Sign-In Form
function toggleSignIn(container) {
  container.innerHTML = '';
  const mockUsers = [
    { id: 'admin', name: 'Admin User', password: 'password' },
    { id: 'user1', name: 'Rakoto Lekely', password: 'password' },
    { id: 'user2', name: 'Ravao Bodo', password: 'password' },
    { id: 'guest', name: 'Mpitsidika', password: '' }
  ];

  const userOptions = mockUsers
    .map(user => `<option value="${user.id}">${user.name}</option>`)
    .join('');

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

// Event Listeners for Tabs
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('#menu button').forEach(button => {
    button.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      handleTabChange(tab);
    });

    // Hover effects
    const defaultMessage = document.getElementById('default-message');
    button.addEventListener('mouseenter', () => {
      const tab = button.getAttribute('data-tab');
      if (tab !== activeTab) {
        defaultMessage.classList.remove('hidden');
      }
    });
    button.addEventListener('mouseleave', () => {
      defaultMessage.classList.add('hidden');
    });
  });

  // Initialize default view
  handleTabChange(activeTab);
});