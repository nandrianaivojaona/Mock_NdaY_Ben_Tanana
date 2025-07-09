// Global error handler for uncaught errors
window.addEventListener('error', function(event) {
  console.error('Uncaught error:', event.error);
  showToast('An unexpected error occurred. Please try again or contact support.');
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('An unexpected error occurred. Please try again or contact support.');
});

let currentUser = null; // Tracks authenticated user
const currentYear = new Date().getFullYear();
// Load embedded mock data
const mockData = JSON.parse(document.getElementById('mockData').textContent);

const mockUsers = [
  { id: 'admin', name: 'Admin User', password: 'password' },
  { id: 'user1', name: 'Rakoto Lekely', password: 'password' },
  { id: 'user2', name: 'Ravao Bodo', password: 'password' },
  { id: 'guest', name: 'Mpitsidika', password: '' }
];

// Function: Handle Tab Switching to Protect "Pay Tax"
function handleTabChange(tab) {
  try {
    const contentDiv = document.getElementById('content');
    const defaultMessage = document.getElementById('default-message');

    // Always clear content first
    contentDiv.innerHTML = '';
    activeTab = tab;
    // Hide mayor's message only if real content is shown

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
          <p>You must be logged in to continue. <a href="#" onclick="event.preventDefault(); toggleSignIn(document.getElementById('content'))">Sign in</a></p>
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
        showConstructionModal();
        defaultMessage.classList.remove('hidden'); // Keep mayor message visible// Show modal instead of replacing content
        hasRealContent = false;
        break;

      case 'signin':
        toggleSignIn(contentDiv);
        break;

      default:
        showConstructionModal();
        defaultMessage.classList.remove('hidden'); // Keep mayor message visible
        hasRealContent = false;
    }

    
    // At the very end of handleTabChange(tab) Clear Modal on Tab Switch
    document.getElementById('construction-modal').classList.add('hidden');
  } catch (error) {
    console.error('Error in handleTabChange:', error);
    showToast('Navigation error occurred. Please try again.');
    // Fallback to safe state
    const contentDiv = document.getElementById('content');
    const defaultMessage = document.getElementById('default-message');
    if (contentDiv) {
      contentDiv.innerHTML = `
        <h2>Navigation Error</h2>
        <p>An error occurred while navigating. Please try again.</p>
        <button onclick="location.reload()">Refresh Page</button>
      `;
    }
    if (defaultMessage) {
      defaultMessage.classList.remove('hidden');
    }
  }
}

// Function: Render Payment Form
function renderPayTaxForm(container, userId) {
    try {
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
          
          try {
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
            } else {
              showToast('Please select a valid tax record to pay.');
            }
          } catch (error) {
            console.error('Payment processing error:', error);
            showToast('Payment processing failed. Please try again or contact support.');
          }
        });
    } catch (error) {
      console.error('Error rendering payment form:', error);
      showToast('Failed to load payment form. Please refresh the page and try again.');
      container.innerHTML = `
        <h2>Error Loading Payment Form</h2>
        <p>Unable to load payment form. Please refresh the page and try again.</p>
        <button onclick="location.reload()">Refresh Page</button>
      `;
    }
  }

// Helper Function: Render Payment successful
function renderPaymentSuccess(container, record) {
    try {
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
    } catch (error) {
      console.error('Error rendering payment success:', error);
      showToast('Payment was processed but display failed. Please check your tax status.');
      container.innerHTML = `
        <div class="success-message">
          <h2>✅ Payment Processed</h2>
          <p>Your payment has been processed successfully.</p>
          <button onclick="handleTabChange('status')">View Tax Status</button>
        </div>
      `;
    }
  }


// Function: Render Tax Status enhanced to show all user Taxes
function renderTaxStatus(container, userId) {
    try {
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
    } catch (error) {
      console.error('Error rendering tax status:', error);
      showToast('Failed to load tax status. Please try again.');
      container.innerHTML = `
        <h2>Error Loading Tax Status</h2>
        <p>Unable to load your tax records. Please try again.</p>
        <button onclick="renderTaxStatus(this.parentElement, '${userId}')">Retry</button>
      `;
    }
  }
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.remove('hidden');
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 3000);
    }
  }
// Function: Sign-In Form
function toggleSignIn(container) {
  try {
    container.innerHTML = ''; // ✅ Clear any previous content

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
      
      try {
        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;

        const user = mockUsers.find(u => u.id === userId);

        if (!user) {
          showToast('User not found!');
          return;
        }

        if (user.password === '' || user.password === password) {
          currentUser = user;
          updateAuthButton();
          showToast(`Welcome, ${user.name}!`);

          // ✅ Reload current tab after login
          handleTabChange(activeTab);
        } else {
          showToast('Invalid credentials. Please try again.');
        }
      } catch (error) {
        console.error('Sign-in error:', error);
        showToast('Sign-in failed. Please try again.');
      }
    });
  } catch (error) {
    console.error('Error rendering sign-in form:', error);
    showToast('Failed to load sign-in form. Please refresh the page.');
    container.innerHTML = `
      <h2>Sign-In Error</h2>
      <p>Unable to load sign-in form. Please refresh the page and try again.</p>
      <button onclick="location.reload()">Refresh Page</button>
    `;
  }
}
// helper function to update the button
function updateAuthButton() {
  document.getElementById('auth-button').innerHTML = `
  <button onclick="event.preventDefault(); toggleSignIn(document.getElementById('content'))">
    Sign In
  </button>
`;

// Restore Mayor's message
document.getElementById('default-message').classList.remove('hidden');
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
// Helper founction for Modal
function showConstructionModal() {
  const modal = document.getElementById('construction-modal');
  modal.classList.remove('hidden');
}

function hideConstructionModal() {
  const modal = document.getElementById('construction-modal');
  modal.classList.add('hidden');
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

