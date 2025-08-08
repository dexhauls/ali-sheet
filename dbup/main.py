import sys
import time
import json
import httpx
from converter import convert_links, add_https_to_links

def upload_to_supabase(input_file='links.json'):
    """Upload the converted links directly to PostgreSQL database"""
    # Supabase service role API key
    SUPABASE_URL = "https://owefpbkhhznrmrfiwtau.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZWZwYmtoaHpucm1yZml3dGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjE0ODgsImV4cCI6MjA2OTkzNzQ4OH0.9chIz_gG7pTSwfwEU83x4FelLOORVfEs5qsn9r_Hwvg"
    TABLE_NAME = "db"  # Table name to insert into
    BATCH_SIZE = 50  # Reduced batch size for better handling
    
    print("\nStarting database upload process...")
    
    try:
        # Load the converted JSON file
        print(f"Loading data from {input_file}...")
        with open(input_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
        print(f"Successfully loaded {len(data)} items")
        
        # First, let's check the structure of the database table
        print("Fetching table structure...")
        definition_url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        }
        
        # Make a request to get the table definition
        response = httpx.get(
            definition_url,
            headers=headers,
            params={"select": "*", "limit": 1},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"Error getting table structure: {response.status_code} - {response.text}")
            return
            
        # Get table columns from the response headers
        range_header = response.headers.get("content-range", "")
        print(f"Table info: {range_header}")
        
        # Process each item to match the expected format
        print("Processing data to match table structure...")
        processed_data = []
        for item in data:
            # Create a new correctly formatted item
            new_item = {
                "_id": str(item.get('id', '')),
                "name": item.get('name', ''),
                "price": float(item.get('price', 0)),
                "image": item.get('image', ''),
                "link": item.get('link', ''),
                "rawlink": item.get('rawlink', item.get('link', '')),  # Preserve original link
                "brand": item.get('brand', ''),
                "batch": item.get('batch', '')
            }
            
            # Add all agent affiliate links
            for agent in ["kakobuy", "superbuy", "basetao", "mulebuy", "joyagoo", "cnfans", 
                         "acbuy", "eastmallbuy", "orientdig", "sifubuy", "loongbuy", 
                         "itaobuy", "lovegobuy", "oopbuy"]:
                if agent in item:
                    new_item[agent] = item[agent]
            
            # Handle category as individual columns with the correct format
            categories = item.get('category', [])
            if isinstance(categories, list):
                for i, cat in enumerate(categories):
                    new_item[f"category[{i}]"] = cat
            
            processed_data.append(new_item)
        
        # Split processed data into batches for uploading
        batches = [processed_data[i:i + BATCH_SIZE] for i in range(0, len(processed_data), BATCH_SIZE)]
        print(f"Splitting data into {len(batches)} batches of {BATCH_SIZE} items each")
        
        # Setup Supabase headers for inserting data
        insert_headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
        # Process each batch
        total_inserted = 0
        total_failed = 0
        
        for i, batch in enumerate(batches):
            try:
                print(f"\nProcessing batch {i+1}/{len(batches)}...")
                
                # Insert batch using Supabase REST API
                insert_url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
                
                # Make API request
                response = httpx.post(
                    insert_url,
                    headers=insert_headers,
                    json=batch,
                    timeout=30
                )
                
                if response.status_code in (200, 201, 204):
                    total_inserted += len(batch)
                    print(f"Batch {i+1} uploaded successfully ({len(batch)} items)")
                else:
                    total_failed += len(batch)
                    print(f"Error processing batch {i+1}: {response.status_code} - {response.text}")
                
                # Small delay between batches
                if i < len(batches) - 1:
                    time.sleep(0.5)
                
            except Exception as e:
                total_failed += len(batch)
                print(f"Error processing batch {i+1}: {str(e)}")
                continue
        
        # Summary
        print("\nUpload complete!")
        print(f"Successfully uploaded: {total_inserted} items")
        print(f"Failed to upload: {total_failed} items")
        
    except FileNotFoundError:
        print(f"Error: {input_file} not found")
    except json.JSONDecodeError:
        print("Error: File contains invalid JSON")
    except Exception as e:
        print(f"Error: {str(e)}")

def print_usage():
    """Print usage instructions"""
    print("\nDatabase Uploader Tool")
    print("=====================")
    print("Commands:")
    print("  python main.py convert    - Convert links from links.json to affiliate links")
    print("  python main.py add-https  - Add HTTPS prefix to links in links_converted.json")
    print("  python main.py upload     - Upload links_converted.json to database")
    print("  python main.py help       - Show this help message")

if __name__ == "__main__":
    try:
        # Choose which operation to perform
        if len(sys.argv) > 1:
            if sys.argv[1] == "convert":
                convert_links()
            elif sys.argv[1] == "add-https":
                add_https_to_links()
            elif sys.argv[1] == "upload":
                upload_to_supabase()
            elif sys.argv[1] == "help":
                print_usage()
            else:
                print(f"Unknown command: {sys.argv[1]}")
                print_usage()
        else:
            # Default to showing usage
            print_usage()
    except KeyboardInterrupt:
        print("\nProcess interrupted by user. Exiting...")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {str(e)}")
    finally:
        print("\nDone")
