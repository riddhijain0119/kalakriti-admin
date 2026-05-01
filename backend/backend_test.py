"""
Comprehensive Backend API Test for Kalakriti Admin Panel
Tests all admin and public endpoints
"""
import requests
import sys
from datetime import datetime

# Use public endpoint
BASE_URL = "https://order-hub-390.preview.emergentagent.com/api"

class KalakritiAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_medium_id = None
        self.test_order_id = None
        self.test_gallery_id = None
        self.test_testimonial_id = None
        self.test_coupon_id = None

    def log(self, msg, status="info"):
        colors = {"pass": "\033[92m✓", "fail": "\033[91m✗", "info": "\033[96m→"}
        print(f"{colors.get(status, '')} {msg}\033[0m")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        h = {'Content-Type': 'application/json'}
        if self.token:
            h['Authorization'] = f'Bearer {self.token}'
        if headers:
            h.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...", "info")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=h, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=h, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=h, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=h, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"PASS - {name} (Status: {response.status_code})", "pass")
            else:
                self.log(f"FAIL - {name} - Expected {expected_status}, got {response.status_code}", "fail")
                self.log(f"  Response: {response.text[:200]}", "fail")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            self.log(f"FAIL - {name} - Error: {str(e)}", "fail")
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        self.log("\n========== HEALTH CHECK ==========", "info")
        return self.run_test("Health Check", "GET", "health", 200)

    def test_admin_login(self):
        """Test admin login"""
        self.log("\n========== ADMIN AUTH ==========", "info")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data={"email": "admin@kalakriti.in", "password": "Kalakriti@2026"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log(f"  Token obtained: {self.token[:30]}...", "pass")
            return True
        return False

    def test_admin_me(self):
        """Test /me endpoint"""
        return self.run_test("Admin Me", "GET", "admin/auth/me", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        self.log("\n========== DASHBOARD ==========", "info")
        success, response = self.run_test("Dashboard Stats", "GET", "admin/dashboard/stats", 200)
        if success:
            self.log(f"  Total orders: {response.get('total_orders', 0)}", "info")
            self.log(f"  Revenue MTD: ₹{response.get('revenue_mtd', 0)}", "info")
            self.log(f"  Pending shipments: {response.get('pending_shipments', 0)}", "info")
        return success, response

    def test_analytics(self):
        """Test analytics endpoints"""
        self.log("\n========== ANALYTICS ==========", "info")
        self.run_test("Revenue Timeseries", "GET", "admin/analytics/revenue-timeseries?days=30", 200)
        self.run_test("Orders by Status", "GET", "admin/analytics/orders-by-status", 200)
        self.run_test("Orders by Medium", "GET", "admin/analytics/orders-by-medium", 200)

    def test_mediums(self):
        """Test mediums CRUD"""
        self.log("\n========== MEDIUMS ==========", "info")
        success, response = self.run_test("List Mediums", "GET", "admin/mediums", 200)
        if success and response:
            self.log(f"  Found {len(response)} mediums", "info")
            if response:
                self.test_medium_id = response[0].get('id')
                self.log(f"  Using medium ID: {self.test_medium_id}", "info")
                # Get single medium
                self.run_test("Get Medium", "GET", f"admin/mediums/{self.test_medium_id}", 200)
                # Update medium
                self.run_test(
                    "Update Medium",
                    "PUT",
                    f"admin/mediums/{self.test_medium_id}",
                    200,
                    data={"description": "Updated test description"}
                )
        return success, response

    def test_orders(self):
        """Test orders endpoints"""
        self.log("\n========== ORDERS ==========", "info")
        success, response = self.run_test("List Orders", "GET", "admin/orders", 200)
        if success and response.get('items'):
            self.log(f"  Total orders: {response.get('total', 0)}", "info")
            orders = response.get('items', [])
            if orders:
                self.test_order_id = orders[0].get('id')
                self.log(f"  Using order ID: {self.test_order_id}", "info")
                # Get single order
                self.run_test("Get Order", "GET", f"admin/orders/{self.test_order_id}", 200)
                # Update notes
                self.run_test(
                    "Update Order Notes",
                    "PUT",
                    f"admin/orders/{self.test_order_id}/notes",
                    200,
                    data={"notes": "Test note from automated testing"}
                )
                # Check serviceability (may fail if no pincode)
                self.run_test(
                    "Check Serviceability",
                    "POST",
                    f"admin/orders/{self.test_order_id}/check-serviceability",
                    200
                )
        return success, response

    def test_gallery(self):
        """Test gallery CRUD"""
        self.log("\n========== GALLERY ==========", "info")
        success, response = self.run_test("List Gallery", "GET", "admin/gallery", 200)
        if success and response:
            self.log(f"  Found {len(response)} gallery items", "info")
            if response:
                self.test_gallery_id = response[0].get('id')
                # Update gallery item
                self.run_test(
                    "Update Gallery",
                    "PUT",
                    f"admin/gallery/{self.test_gallery_id}",
                    200,
                    data={"featured": True}
                )
        return success, response

    def test_testimonials(self):
        """Test testimonials CRUD"""
        self.log("\n========== TESTIMONIALS ==========", "info")
        success, response = self.run_test("List Testimonials", "GET", "admin/testimonials", 200)
        if success and response:
            self.log(f"  Found {len(response)} testimonials", "info")
            if response:
                self.test_testimonial_id = response[0].get('id')
        return success, response

    def test_content(self):
        """Test content/CMS"""
        self.log("\n========== CONTENT/CMS ==========", "info")
        success, response = self.run_test("Get Homepage Content", "GET", "admin/content/homepage", 200)
        if success:
            self.log(f"  Hero title: {response.get('hero_title', '')[:50]}", "info")
        return success, response

    def test_coupons(self):
        """Test coupons CRUD"""
        self.log("\n========== COUPONS ==========", "info")
        success, response = self.run_test("List Coupons", "GET", "admin/coupons", 200)
        if success and response:
            self.log(f"  Found {len(response)} coupons", "info")
            if response:
                self.test_coupon_id = response[0].get('id')
                self.log(f"  Coupon code: {response[0].get('code')}", "info")
        return success, response

    def test_settings(self):
        """Test settings"""
        self.log("\n========== SETTINGS ==========", "info")
        success, response = self.run_test("Get Settings", "GET", "admin/settings", 200)
        if success:
            self.log(f"  Brand: {response.get('brand_name')}", "info")
            self.log(f"  Pickup pincode: {response.get('pickup_pincode')}", "info")
        return success, response

    def test_public_endpoints(self):
        """Test public API endpoints (no auth required)"""
        self.log("\n========== PUBLIC API ==========", "info")
        # Temporarily remove token for public tests
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test("Public Mediums", "GET", "public/mediums", 200)
        if success:
            self.log(f"  Public mediums: {len(response)}", "info")
        
        self.run_test("Public Gallery", "GET", "public/gallery", 200)
        self.run_test("Public Testimonials", "GET", "public/testimonials", 200)
        self.run_test("Public Homepage", "GET", "public/homepage", 200)
        self.run_test("Public Site Settings", "GET", "public/site-settings", 200)
        
        # Test pricing calculation
        self.run_test(
            "Public Pricing Calculate",
            "POST",
            "public/pricing/calculate",
            200,
            data={
                "medium_slug": "watercolour",
                "size": "A3",
                "faces": 2,
                "rush": True
            }
        )
        
        # Test coupon validation
        self.run_test(
            "Public Coupon Validate",
            "POST",
            "public/coupons/validate",
            200,
            data={
                "code": "WELCOME10",
                "order_total": 3000
            }
        )
        
        # Restore token
        self.token = temp_token

    def test_auth_protection(self):
        """Test that admin endpoints require auth"""
        self.log("\n========== AUTH PROTECTION ==========", "info")
        temp_token = self.token
        self.token = None
        
        success, _ = self.run_test("Mediums without auth (should fail)", "GET", "admin/mediums", 401)
        
        self.token = temp_token
        return success

    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "=" * 60, "info")
        self.log(f"TESTS COMPLETED: {self.tests_passed}/{self.tests_run} passed", "info")
        self.log("=" * 60, "info")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 ALL TESTS PASSED!", "pass")
            return 0
        else:
            failed = self.tests_run - self.tests_passed
            self.log(f"❌ {failed} TESTS FAILED", "fail")
            return 1

def main():
    tester = KalakritiAPITester()
    
    # Run all tests
    tester.test_health()
    
    if not tester.test_admin_login():
        print("❌ Login failed - cannot continue")
        return 1
    
    tester.test_admin_me()
    tester.test_dashboard_stats()
    tester.test_analytics()
    tester.test_mediums()
    tester.test_orders()
    tester.test_gallery()
    tester.test_testimonials()
    tester.test_content()
    tester.test_coupons()
    tester.test_settings()
    tester.test_public_endpoints()
    tester.test_auth_protection()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
