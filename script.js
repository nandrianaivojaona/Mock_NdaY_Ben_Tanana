let currentUser = null; // Tracks authenticated user
const currentYear = new Date().getFullYear();

// Load embedded mock data
const mockData = JSON.parse(document.getElementById('mockData').textContent);

// State variable for active tab
let activeTab = 'home';

// Mock users list (for sign-in)
const mockUsers = [
  { id: 'admin', name: 'Admin User', password: 'password' },
  { id: 'user1', name: 'Rakoto Lekely', password: 'password' },
  { id: 'user2', name: 'Ravao Bodo', password: 'password' },
  { id: 'guest', name: 'Mpitsidika', password: '' }
];

// Function: Handle Tab Switching
function handleTabChange(tab) {
  const contentDiv = document.getElementById('content');
  const defaultMessage = document.getElementById('default-message');

  // Always clear content first
  contentDiv.innerHTML = '';
  defaultMessage.classList.remove('hidden');
  if (hasRealContent) {
    defaultMessage.classList.add('hidden');
  }
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
        // Force hide default message
        defaultMessage.classList.add('hidden');
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
      showConstructionModal();
      hasRealContent = false;
      break;
    case 'signin':
      toggleSignIn(contentDiv);
      break;
    default:
      showConstructionModal();
      hasRealContent = false;
  }

  if (hasRealContent) {
    defaultMessage.classList.add('hidden');
  }

  // Clear modal on tab change
  document.getElementById('construction-modal').classList.add('hidden');
}

// Function: Render Home Page
function renderHome(container) {
  container.innerHTML = '';
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
        <button type="submit" class="btn btn--primary">Pay Now</button>
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
        <button type="submit" class="btn btn--primary">Proceed to Payment</button>
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
      selectedRecord.paid = true;
      renderPaymentSuccess(container, selectedRecord);
    }
  });
}

// Helper Function: Render Payment Success
function renderPaymentSuccess(container, record) {
  container.innerHTML = `
    <div class="success-message">
      <h2>✅ Payment Successful!</h2>
      <p><strong>Plot Number:</strong> ${record.plotNumber}</p>
      <p><strong>Year:</strong> ${record.year}</p>
      <p><strong>Amount Paid:</strong> ${record.amount}</p>
      <p><strong>Transaction ID:</strong> ${record.id}</p>
      <p><strong>Blockchain Verified:</strong> Yes</p>
      <button class="btn btn--primary" onclick="handleTabChange('status')">View Updated Tax Status</button>
    </div>
  `;
}

// Function: Render Tax Status
function renderTaxStatus(container, userId) {
  const userRecords = mockData.userTaxRecords[userId] || [];

  if (userRecords.length === 0) {
    container.innerHTML = `
      <h2>No Tax Records Found</h2>
      <p>You have no land tax records available.</p>
    `;
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

  container.innerHTML = `
    <h2>Your Tax Status</h2>
    <div class="tax-list">
      ${allTaxesHTML}
    </div>
  `;
}

// Function: Sign-In Form
function toggleSignIn(container) {
  container.innerHTML = ''; // Clear any previous content

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
      <button type="submit" class="btn btn--sign-in">Sign In</button>
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

// Update Auth Button UI
function updateAuthButton() {
  const authBtnContainer = document.getElementById('auth-button');

  if (currentUser) {
    authBtnContainer.innerHTML = `
      <button class="btn btn--sign-in" style="background-color: #ff4d4d;" 
              onclick="event.preventDefault(); currentUser = null; updateAuthButton(); showToast('Signed out successfully');">
        Sign Out (${currentUser.name})
      </button>
    `;
  } else {
    authBtnContainer.innerHTML = `
      <button class="btn btn--sign-in" onclick="event.preventDefault(); toggleSignIn(document.getElementById('content'))">
        Sign In
      </button>
    `;
  }
}

// Show Toast Notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Modal Functions
function showConstructionModal() {
  document.getElementById('construction-modal').classList.remove('hidden');
}

function hideConstructionModal() {
  document.getElementById('construction-modal').classList.add('hidden');
}

// Hover behavior for menu buttons
document.querySelectorAll('.nav__list .btn').forEach(button => {
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