# Prima Facie - Interactive Manual Testing Guide
**🎯 Follow this step-by-step guide to validate authentication and RBAC**

## 🧪 **TESTING ENVIRONMENT**
- **URL**: http://localhost:3000
- **Mock Authentication**: ✅ Enabled
- **Test Status**: Ready for manual validation

## 🔑 **TEST CREDENTIALS**
```
Admin:    admin@test.com    / 123456 → Should redirect to /dashboard
Lawyer:   lawyer@test.com   / 123456 → Should redirect to /dashboard  
Client:   client@test.com   / 123456 → Should redirect to /portal/client
```

## 🚀 **STEP-BY-STEP TESTING PROTOCOL**

### **🌐 Step 1: Test Root Path Behavior**
1. **Go to**: http://localhost:3000/
2. **Expected**: Should redirect to login page
3. **Verify**: URL changes to `/login` and login form appears
4. **Status**: ✅ Pass / ❌ Fail

### **🔐 Step 2: Test Login Authentication**

#### **Test 2A: Admin Login**
1. **Go to**: http://localhost:3000/login
2. **Enter**: `admin@test.com` / `123456`
3. **Click**: "Entrar" button
4. **Expected**: Redirect to `/dashboard` with admin navigation
5. **Status**: ✅ Pass / ❌ Fail

#### **Test 2B: Logout and Test Lawyer Login**
1. **Click**: Logout button (if visible)
2. **Enter**: `lawyer@test.com` / `123456`  
3. **Click**: "Entrar" button
4. **Expected**: Redirect to `/dashboard` with lawyer navigation
5. **Status**: ✅ Pass / ❌ Fail

#### **Test 2C: Logout and Test Client Login**
1. **Click**: Logout button (if visible)
2. **Enter**: `client@test.com` / `123456`
3. **Click**: "Entrar" button  
4. **Expected**: Redirect to `/portal/client` with client interface
5. **Status**: ✅ Pass / ❌ Fail

#### **Test 2D: Invalid Credentials**
1. **Clear form and enter**: `invalid@test.com` / `wrong`
2. **Click**: "Entrar" button
3. **Expected**: Error message appears, no redirect
4. **Status**: ✅ Pass / ❌ Fail

### **🛡️ Step 3: Test Role-Based Access Control**

#### **Test 3A: Admin Role Testing** (Login as admin first)
1. **Navigate to**: http://localhost:3000/admin
2. **Expected**: ✅ Access granted - Admin panel loads
3. **Navigate to**: http://localhost:3000/dashboard  
4. **Expected**: ✅ Access granted - Dashboard loads
5. **Navigate to**: http://localhost:3000/portal/client
6. **Expected**: ❌ Access denied - Redirected away
7. **Status**: ✅ Pass / ❌ Fail

#### **Test 3B: Lawyer Role Testing** (Login as lawyer)
1. **Logout** and login as `lawyer@test.com` / `123456`
2. **Navigate to**: http://localhost:3000/admin
3. **Expected**: ❌ Access denied - Redirected to dashboard
4. **Navigate to**: http://localhost:3000/dashboard
5. **Expected**: ✅ Access granted - Dashboard loads
6. **Navigate to**: http://localhost:3000/portal/client  
7. **Expected**: ❌ Access denied - Redirected away
8. **Status**: ✅ Pass / ❌ Fail

#### **Test 3C: Client Role Testing** (Login as client)
1. **Logout** and login as `client@test.com` / `123456`
2. **Navigate to**: http://localhost:3000/portal/client
3. **Expected**: ✅ Access granted - Client portal loads
4. **Navigate to**: http://localhost:3000/admin
5. **Expected**: ❌ Access denied - Redirected away
6. **Navigate to**: http://localhost:3000/dashboard
7. **Expected**: ❌ Access denied - Redirected away  
8. **Status**: ✅ Pass / ❌ Fail

### **⚡ Step 4: Test Advanced Scenarios**

#### **Test 4A: Direct URL Access Without Auth**
1. **Open new incognito/private window**
2. **Try accessing**: http://localhost:3000/dashboard
3. **Expected**: Redirect to login with `redirectedFrom` parameter
4. **After login**: Should redirect back to originally requested page
5. **Status**: ✅ Pass / ❌ Fail

#### **Test 4B: Authentication Persistence**
1. **Login as any user**
2. **Refresh the page** (F5 or Cmd+R)
3. **Expected**: User remains logged in, no re-login required
4. **Open new tab** and navigate to protected route
5. **Expected**: Still authenticated, direct access granted
6. **Status**: ✅ Pass / ❌ Fail

#### **Test 4C: Session Management**
1. **While authenticated, navigate to**: http://localhost:3000/login
2. **Expected**: Should redirect to appropriate dashboard (not show login form)
3. **Status**: ✅ Pass / ❌ Fail

## 🎨 **USER EXPERIENCE CHECKLIST**

### **Visual & UX Elements**
- [ ] Login form displays properly with email and password fields
- [ ] "Entrar" (Login) button is visible and clickable
- [ ] "Esqueceu sua senha?" (Forgot password) link works
- [ ] "Crie uma nova conta" (Create account) link works  
- [ ] Error messages display clearly in Portuguese
- [ ] Loading states show during authentication
- [ ] Navigation menus reflect user role appropriately
- [ ] Logout functionality works and clears session

### **Responsive Design**
- [ ] Login page looks good on desktop
- [ ] Login page looks good on mobile/tablet
- [ ] Dashboard layouts are responsive
- [ ] All interactive elements are touch-friendly

## 🚨 **COMMON ISSUES TO WATCH FOR**

### **Authentication Issues**
- ❌ Login form not submitting
- ❌ Credentials not validating properly  
- ❌ Redirects not working after login
- ❌ Error messages not displaying
- ❌ Loading states stuck or missing

### **Route Protection Issues**
- ❌ Protected routes accessible without authentication
- ❌ Role restrictions not enforced
- ❌ Unauthorized users accessing admin/client areas
- ❌ Redirect loops or infinite redirects

### **Session Management Issues**
- ❌ Authentication state lost on page refresh
- ❌ Logout not clearing session properly
- ❌ Multiple tabs showing different auth states
- ❌ Login page accessible when already authenticated

## 📊 **TESTING RESULTS TEMPLATE**

```
🧪 PRIMA FACIE MANUAL TESTING RESULTS
=====================================
Date: [Fill in date]
Tester: [Your name]

Root Path Redirect:           ✅ Pass / ❌ Fail
Admin Login Flow:             ✅ Pass / ❌ Fail  
Lawyer Login Flow:            ✅ Pass / ❌ Fail
Client Login Flow:            ✅ Pass / ❌ Fail
Invalid Credentials:          ✅ Pass / ❌ Fail
Admin RBAC:                   ✅ Pass / ❌ Fail
Lawyer RBAC:                  ✅ Pass / ❌ Fail
Client RBAC:                  ✅ Pass / ❌ Fail
Direct URL Protection:        ✅ Pass / ❌ Fail
Authentication Persistence:   ✅ Pass / ❌ Fail
Session Management:           ✅ Pass / ❌ Fail

Overall Status: ✅ All Pass / ⚠️ Some Issues / ❌ Major Issues
```

## 🎯 **SUCCESS CRITERIA**

**✅ FULL SUCCESS**: All tests pass, no authentication bypasses, proper role restrictions
**⚠️ PARTIAL SUCCESS**: Minor UX issues but security intact  
**❌ NEEDS WORK**: Authentication bypassed or role restrictions not working

---

**🎉 Begin testing! All browser tabs are ready for validation.**