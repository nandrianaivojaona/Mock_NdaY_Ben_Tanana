let currentUser = null; // Tracks authenticated user
const currentYear = new Date().getFullYear();
// Load embedded mock data
const mockData = JSON.parse(document.getElementById('mockData').textContent);

// State variable for active tab
let activeTab = 'home';

// Function: Handle Tab Switching to Protect "Pay Tax"
function handleTabChange(tab) {
    const contentDiv = document.getElementById('content');
    const defaultMessage = document.getElementById('default-message');
  
    // Clear previous content
    contentDiv.innerHTML = '';
    activeTab = tab;
  
    // Render based on tab
    switch (tab) {
        case 'home':
            renderHome(contentDiv);
            break;
  
        case 'pay':
            if (!currentUser) {
              contentDiv.innerHTML = `
                <h2>Access Denied</h2>
                <p>Please <a href="#" onclick="event.preventDefault(); toggleSignIn(contentDiv)">sign in</a> to pay land tax.</p>
              `;
            } else {
              renderPayTaxForm(contentDiv, currentUser.id);
            }
            break;
  
        case 'status':
                if (!currentUser) {
                  contentDiv.innerHTML = `
                    <h2>Access Denied</h2>
                    <p>Please <a href="#" onclick="event.preventDefault(); toggleSignIn(contentDiv)">sign in</a> to view your tax status.</p>
                  `;
                } else {
                  renderTaxStatus(contentDiv, currentUser.id);
                }
            break;
  
        case 'signin':
                toggleSignIn(contentDiv);
            break;
  
      default:
        contentDiv.innerHTML = `<h2>${tab.replace(/^\w/, c => c.toUpperCase())} Page</h2><p>Under construction...</p>`;
    }
  
    // Hide default message
    defaultMessage.classList.add('hidden');
    // Update the active tab to ensure the auth button reflects current state whenever a tab is changed
    updateAuthButton();
  }

// Function: Render Home
function renderHome(container) {
  container.innerHTML = `
    <h2>Welcome to NdaY'Ben'Tanàna</h2>
    <p>This platform simplifies civic duties and empowers communities through transparency and innovation.</p>
  `;
}

// Function: Render Payment Form
function renderPayTaxForm(container, userId) {
    const userRecords = mockData.userTaxRecords[userId] || [];
  
    // Filter unpaid taxes from last year or earlier
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
          </select>
          <br><br>
          <button type="submit">Proceed to Payment</button>
        </form>
      `;
    }
    // Validation code to ensure the user selects a record
    function validateMockData() {
        const validUserIds = mockUsers.map(u => u.id);
        const taxRecordKeys = Object.keys(mockData.userTaxRecords);
      
        const invalidKeys = taxRecordKeys.filter(key => !validUserIds.includes(key));
      
        if (invalidKeys.length > 0) {
          console.warn('⚠️ Warning: Some user IDs in userTaxRecords do not match mockUsers:', invalidKeys);
        } else {
          console.log('✅ All user IDs in mockData are consistent.');
        }
      }
      
      // Call once on page load
      validateMockData();
    // Attach event listener to the form to Update renderPayTaxForm() to Mark Tax as Paid
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
          // ✅ Simulate marking the record as paid
          selectedRecord.paid = true;
      
          // Re-render success screen
          renderPaymentSuccess(container, selectedRecord);
        }
      });
  }

// Helper Function: Render Payment successful
function renderPaymentSuccess(container, record) {
    container.innerHTML = `
      <div class="success-message">
        <h2>✅ Payment Successful!</h2>
        <p><strong>Plot Number:</strong> ${record.plotNumber}</p>
        <p><strong>Year:</strong> ${record.year}</p>
        <p><strong>Amount Paid:</strong> ${record.amount}</p>
        <p><strong>Transaction ID:</strong> ${record.id}</p>
        <p><strong>Blockchain Verified:</strong> Yes</p>
        <button onclick="handleTabChange('status')">View Updated Tax Status</button>
      </div>
    `;
  }

const submitButton = document.createElement('button');
submitButton.textContent = 'Submit';
form.appendChild(submitButton);

container.appendChild(form);

// Function: Render Tax Status enhanced to show all user Taxes
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
    const mockUsers = [
      { id: 'admin', name: 'Admin User', password: 'password' },
      { id: 'user1', name: 'Rakoto Lekely', password: 'password' },
      { id: 'user2', name: 'Ravao Bodo', password: 'password' },
      { id: 'user3', name: 'Rajaona Andry', password: 'password' },
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
          updateAuthButton(); // 👈 This line updates the button UI
          showToast(`Welcome, ${user.name}!`);
          handleTabChange('pay');
        } else {
          alert('Invalid Credentials');
        }
      });
  }
// helper function to update the button
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
// Hover behavior for menu buttons
document.querySelectorAll('#menu button').forEach(button => {
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