import psycopg2

con = psycopg2.connect(database = "h2x",
                       user = "postgres",
                       password = "postgres",
                       host="deploy.h2xengineering.com",
                       port="5432")

# Create cursor
cursor = con.cursor()

# Get db tables
cursor.execute("select relname from pg_class where relkind='r' and relname !~ '^(pg_|sql_)';")
db = cursor.fetchall()
# print(db)

# Print column names
# cursor.execute("Select * FROM access_events")
# colnames = [desc[0] for desc in cursor.description]
# print(colnames)


# cursor.execute("DELETE FROM profile WHERE username = 'test'")
# # print ("Database opened successfully")
# cursor.commit()

cursor.execute("Select * FROM access_events where username = 'tester'")
cursor.execute("Delete FROM access_events where username = 'tester'")
cursor.execute("DELETE FROM profile WHERE username = 'tester'")
con.commit()

#closing database connection.
if(con):
    cursor.close()
    con.close()
    print("PostgreSQL connection is closed")