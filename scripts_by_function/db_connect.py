import psycopg2

con = psycopg2.connect(database = "h2x", user = "postgres", password = "postgres", host="deploy@h2xengineering.com", port="5432")

print ("Database opened successfully")