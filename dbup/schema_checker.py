import httpx

# Supabase service role API key
SUPABASE_URL = "https://owefpbkhhznrmrfiwtau.supabase.co/"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZWZwYmtoaHpucm1yZml3dGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjE0ODgsImV4cCI6MjA2OTkzNzQ4OH0.9chIz_gG7pTSwfwEU83x4FelLOORVfEs5qsn9r_Hwvg"
TABLE_NAME = "db"

# Function to get table structure
def get_table_structure():
    print(f"Checking structure of table: {TABLE_NAME}")
    
    # Setup headers for Supabase API request
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    
    # First get metadata about the table from Postgres information_schema
    metadata_url = f"{SUPABASE_URL}/rest/v1/rpc/get_table_info"
    
    payload = {
        "table_name": TABLE_NAME
    }
    
    try:
        # Try to actually get some data from the table
        response = httpx.get(
            f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}",
            headers=headers,
            params={"limit": 1},
            timeout=10
        )
        
        if response.status_code == 200:
            print("Successfully fetched sample data from table")
            data = response.json()
            if data:
                print("\nSample record from table:")
                for key, value in data[0].items():
                    print(f"  {key}: {type(value).__name__}")
            else:
                print("No data found in table")
                
            # Also get headers
            print("\nResponse headers:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")
        else:
            print(f"Error fetching data: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error checking schema: {str(e)}")

if __name__ == "__main__":
    get_table_structure() 