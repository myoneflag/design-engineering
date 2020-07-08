import unittest
from methods import methods
from selenium.webdriver.common.action_chains import ActionChains
import time
import psycopg2

class test_signup(unittest.TestCase):
    test = methods()

    def setUp(self):
        self.driver = self.test.get_driver()
        self.actions = ActionChains(self.driver)
        time.sleep(25)
        # pass

    def tearDown(self):
        time.sleep(2)
        self.driver.close()
        # pass

    def test_signup(self):
        # Test signup page

        # Start
        print("----------------\nStart Signup Test...")

        username = "tester"

        # Perform Signup
        print("Signing up...")
        self.test.signup_with_username(username)
        time.sleep(10)

        # Check if successful
        try:
            self.driver.find_element_by_xpath("/html/body/div[1]/div/div/div/div[1]/div/h1")
            checker = True
            print("Signup successful!")
        except:
            checker = False
        self.assertTrue(checker)

        # Logout
        print("Logging out...")
        self.test.logout()
        time.sleep(5)
        print("Logout successful!")

        # Access database and delete created user
        print("Accessing database to delete created user...")
        con = psycopg2.connect(database="h2x",
                               user="postgres",
                               password="postgres",
                               host="deploy.h2xengineering.com",
                               port="5432")
        print("Connection successful!")

        print("Creating cursor object...")
        cursor = con.cursor()
        print("Cursor object created!")

        print("Pointing to created user...")
        cursor.execute("Select * FROM access_events where username = 'tester'")
        print("User found!")

        print("Deleting user...")
        cursor.execute("Delete FROM access_events where username = 'tester'")
        cursor.execute("DELETE FROM profile WHERE username = 'tester'")
        con.commit()
        print("User deleted!")

        # Close database connection
        print("Closing database connection...")
        if (con):
            cursor.close()
            con.close()
            print("PostgreSQL connection is closed")

        # End
        print("Signup Test Complete!\n----------------")

if __name__ == '__main__':
    unittest.main()