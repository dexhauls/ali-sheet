import json
import requests
import os
import concurrent.futures
import time
import sys

def convert_links(selected_agent="kakobuy"):
    """Convert links from links.json to a more usable format with affiliate links for selected agent"""
    start_time = time.time()
    print(f"Starting link conversion process for agent: {selected_agent}...")
    
    # Load the JSON file
    try:
        # Use the current directory
        json_path = 'links.json'
        print(f"Loading links from {json_path}...")
        with open(json_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        print(f"Successfully loaded {len(data)} items from links.json")
    except FileNotFoundError:
        print(f"Error: links.json file not found")
        return
    except json.JSONDecodeError:
        print("Error: links.json contains invalid JSON")
        return
    
    # API endpoint for link conversion
    conversion_api = "https://affiliate.repsheet.net/convert?link="
    converted_count = 0
    failed_count = 0
    
    # For logging progress
    total_items = len(data)
    processed_items = 0
    
    # Function to process a single item
    def process_item(item_with_index):
        nonlocal processed_items
        i, item = item_with_index

        if "link" not in item:
            return (i, item, False, "No link field")

        original_link = item["link"]
        # Store the original link as rawlink
        item["rawlink"] = original_link
        
        try:
            conversion_url = f"{conversion_api}{original_link}"
            response = requests.get(conversion_url, timeout=5)
            if response.status_code == 200:
                try:
                    response_data = json.loads(response.text)
                    # Store all agent affiliate links
                    for agent in [
                        "kakobuy", "superbuy", "basetao", "mulebuy", "joyagoo", "cnfans",
                        "acbuy", "eastmallbuy", "orientdig", "sifubuy", "loongbuy",
                        "itaobuy", "lovegobuy", "oopbuy"
                    ]:
                        if agent in response_data:
                            item[agent] = response_data[agent] + "/dexikos"
                    
                    # Keep the original link as the main link field
                    item["link"] = original_link
                    return (i, item, True, f"Converted with {len([k for k in item.keys() if k in ['kakobuy', 'superbuy', 'basetao', 'mulebuy', 'joyagoo', 'cnfans', 'acbuy', 'eastmallbuy', 'orientdig', 'sifubuy', 'loongbuy', 'itaobuy', 'lovegobuy', 'oopbuy']])} agents")
                except json.JSONDecodeError:
                    # Fallback: if response is not JSON, treat it as a direct affiliate link
                    affiliate_link = f"https://{response.text.strip()}/dexikos"
                    item["kakobuy"] = affiliate_link
                    item["link"] = original_link
                    return (i, item, True, affiliate_link)
            else:
                return (i, item, False, f"API request failed: {response.status_code}")

        except Exception as e:
            return (i, item, False, str(e))

    # Real-time status printing function
    def print_status():
        sys.stdout.write(f"\rProcessing: {processed_items}/{total_items} items ({(processed_items/total_items)*100:.1f}%) - Converted: {converted_count} | Failed: {failed_count}")
        sys.stdout.flush()
    
    # Process items in parallel with more workers
    print(f"Starting parallel processing with 20 workers...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        # Submit all tasks to the executor
        future_to_item = {executor.submit(process_item, item_with_index): item_with_index for item_with_index in enumerate(data)}
        
        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_item):
            i, updated_item, success, message = future.result()
            data[i] = updated_item
            processed_items += 1
            
            if success:
                converted_count += 1
                if converted_count % 10 == 0 or processed_items == total_items:
                    print_status()
            else:
                failed_count += 1
                print(f"\nFailed item {i+1}: {message}")
                print_status()
    
    # Calculate processing time
    elapsed_time = time.time() - start_time
    
    # Save the updated data back to a new JSON file
    try:
        output_path = 'links_converted.json'
        print(f"\n\nSaving results to {output_path}...")
        with open(output_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        print(f"File saved successfully!")
        print(f"\nConversion complete in {elapsed_time:.2f} seconds!")
        print(f"Successfully converted: {converted_count}/{total_items}")
        print(f"Failed to convert: {failed_count}/{total_items}")
    except Exception as e:
        print(f"\nError saving converted links: {str(e)}")

def add_https_to_links():
    """Add https:// prefix to all links in the converted file"""
    input_file = 'links_converted.json'
    
    print("Adding https:// prefix to all links...")
    
    try:
        # Load the converted JSON file
        with open(input_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
        print(f"Successfully loaded {len(data)} items from links_converted.json")
        
        # Count of links updated
        updated_count = 0
        
        # Add https:// to each link if it doesn't already have it
        for item in data:
            if "link" in item and not item["link"].startswith("http"):
                item["link"] = f"https://{item['link']}"
                updated_count += 1
        
        # Save the updated data back to the file
        with open(input_file, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        
        print(f"Successfully added https:// prefix to {updated_count} links")
        print(f"Updated file saved to {input_file}")
        
    except FileNotFoundError:
        print(f"Error: links_converted.json file not found")
    except json.JSONDecodeError:
        print("Error: links_converted.json contains invalid JSON")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    try:
        # Choose which operation to perform
        if len(sys.argv) > 1:
            if sys.argv[1] == "add-https":
                add_https_to_links()
            else:
                # Pokud je zadán agent, použij ho
                agent = sys.argv[1]
                convert_links(agent)
        else:
            convert_links()
    except KeyboardInterrupt:
        print("\nProcess interrupted by user. Exiting...")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {str(e)}")
    finally:
        print("\nDone")