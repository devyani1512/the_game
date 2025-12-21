from flask import Flask, request, jsonify
import requests
import re

app = Flask(__name__)

@app.route('/validate', methods=['POST'])
def validate_place():
    data = request.get_json()
    place = data.get('place')

    if not place:
        return jsonify({"error": "No place provided"}), 400

    try:
        print(f"🔍 Validating place: {place}")

        url = "https://en.wikipedia.org/w/api.php"
        headers = {
            "User-Agent": "AtlasGameValidator/1.0 (your-contact@example.com)"
        }

        # Step 1: Check if page exists and get page ID + possible redirect
        params = {
            "action": "query",
            "titles": place,
            "format": "json",
            "redirects": True  # Resolve redirects automatically
        }

        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

        pages = data["query"].get("pages", {})
        if not pages or "-1" in pages:
            return jsonify({
                "place": place,
                "valid": False,
                "reason": "Page not found",
                "source": "Wikipedia"
            })

        page = next(iter(pages.values()))
        page_id = page["pageid"]
        title = page["title"]

        # Step 2: Fetch categories for this page
        cat_params = {
            "action": "query",
            "prop": "categories",
            "pageids": page_id,
            "format": "json",
            "cllimit": "50"  # Get up to 50 categories
        }

        cat_response = requests.get(url, params=cat_params, headers=headers)
        cat_response.raise_for_status()
        cat_data = cat_response.json()

        categories = [
            cat["title"]
            for cat in cat_data["query"]["pages"][str(page_id)].get("categories", [])
        ]

        # Normalize category names (remove "Category:" prefix)
        category_names = [c.replace("Category:", "").lower() for c in categories]

        # Strong indicators of a geographical place
        geo_indicators = [
            "cities in", "towns in", "villages in", "municipalities in",
            "populated places in", "mountains of", "rivers in", "lakes in",
            "islands in", "countries", "capitals in", "provinces of",
            "states of", "districts in", "regions of", "continents"
        ]

        is_geographical = any(indicator in cat_name for cat_name in category_names for indicator in geo_indicators)

        
        if not is_geographical:
            intro_params = {
                "action": "query",
                "prop": "extracts",
                "pageids": page_id,
                "format": "json",
                "exintro": True,
                "explaintext": True
            }
            intro_resp = requests.get(url, params=intro_params, headers=headers).json()
            extract = intro_resp["query"]["pages"][str(page_id)].get("extract", "").lower()

            first_sentence = extract.split('.')[0]

            place_keywords = ["city", "town", "village", "municipality", "capital", "country", "province", "state", "island", "mountain", "river", "lake"]
            if any(keyword in first_sentence for keyword in place_keywords):
                is_geographical = True

        
        person_indicators = ["born", "died", "actor", "singer", "politician", "president", "king", "queen", "novelist", "poet"]
        if any(ind in extract.lower()[:500] for ind in person_indicators):  # only first ~500 chars
            if "was an" in extract.lower()[:200] or "is a " in extract.lower()[:200]:
                is_geographical = False

        return jsonify({
            "place": place,
            "normalized_title": title,
            "valid": is_geographical,
            "reason": "Geographical place" if is_geographical else "Not a geographical location",
            "categories_sample": categories[:10],  # for debugging
            "source": "Wikipedia"
        })

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Request failed: {str(e)}"}), 502
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(port=5001)
# from flask import Flask, request, jsonify
# import requests
# import re

# app = Flask(__name__)

# @app.route('/validate', methods=['POST'])
# def validate_place():
#     data = request.get_json()
#     place = data.get('place')

#     if not place:
#         return jsonify({"error": "No place provided"}), 400

#     try:
#         print(f"🔍 Validating place: {place}")

#         url = "https://en.wikipedia.org/w/api.php"
#         params = {
#             "action": "query",
#             "titles": place,
#             "format": "json",
#             "prop": "extracts",
#             "exintro": True,
#             "explaintext": True
#         }

#         headers = {
#             "User-Agent": "AtlasGameValidator/1.0"
#         }

#         response = requests.get(url, params=params, headers=headers)
#         data = response.json()

#         pages = data.get("query", {}).get("pages", {})
#         page_id = next(iter(pages))

#         if page_id == "-1":
#             return jsonify({"place": place, "valid": False, "reason": "Page not found"})

#         full_extract = pages[page_id].get("extract", "").strip()
#         first_line = full_extract.split('\n')[0].lower()
#         full_text = full_extract.lower()

        
#         keywords = [
#             "city", "country", "town", "village", "state", "province", "district", "region",
#             "territory", "capital", "municipality", "island", "continent", "mountain", "river"
#         ]
#         valid = any(re.search(rf"\b{word}\b", first_line) for word in keywords)

        
#         disqualifiers = [
#             "emperor", "king", "queen", "president", "actor", "singer", "fictional",
#             "was born", "writer", "poet", "scientist", "politician", "general", "character", "novelist"
#         ]
#         if any(term in full_text for term in disqualifiers):
#             valid = False

#         return jsonify({
#             "place": place,
#             "valid": valid,
#             "extract_snippet": first_line,
#             "source": "Wikipedia"
#         })

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(port=5001)


# from flask import Flask, request, jsonify
# import requests

# app = Flask(__name__)

# @app.route('/validate', methods=['POST'])
# def validate_place():
#     data = request.get_json()
#     place = data.get('place')

#     if not place:
#         return jsonify({"error": "No place provided"}), 400

#     try:
#         print(f" Validating place: {place}")
#         url = "https://en.wikipedia.org/w/api.php"
#         params = {
#             "action": "query",
#             "titles": place,
#             "format": "json"
#         }

#         #  Add headers with a proper User-Agent
#         headers = {
#             "User-Agent": "AtlasGameValidator/1.0 (https://the-game-q9mr.onrender.com)"
#         }

#         response = requests.get(url, params=params, headers=headers)
#         data = response.json()

#         pages = data.get("query", {}).get("pages", {})
#         page_id = next(iter(pages))

#         valid = page_id != "-1"

#         return jsonify({
#             "place": place,
#             "valid": valid,
#             "source": "Wikipedia"
#         })

#     except Exception as e:
#         print(f" Exception occurred: {str(e)}")
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(port=5001)

# from flask import Flask, request, jsonify
# import undetected_chromedriver as uc
# from selenium.webdriver.common.by import By
# import time

# app = Flask(__name__)

# @app.route('/validate', methods=['POST'])
# def validate_place():
#     data = request.get_json()
#     place = data.get('place')

#     if not place:
#         return jsonify({"error": "No place provided"}), 400

#     driver = None
#     try:
#         print(f" Validating place: {place}")

#         options = uc.ChromeOptions()
#         options.add_argument("--headless=new")  #  safer than options.headless = True
#         options.add_argument("--disable-blink-features=AutomationControlled")
#         options.add_argument("--no-sandbox")
#         options.add_argument("--disable-dev-shm-usage")

#         driver = uc.Chrome(options=options)

#         search_url = f"https://en.wikipedia.org/wiki/Special:Search?search={place}&go=Go"
#         print(f" Navigating to: {search_url}")
#         driver.get(search_url)

#         time.sleep(3)  # Allow page to load fully
#         if not driver.window_handles:
#             raise Exception("Browser window closed prematurely")

#         current_url = driver.current_url
#         title = driver.title.lower()

#         print(f" Current URL: {current_url}, Title: {title}")

#         valid = not ("search" in title or "/w/index.php?" in current_url)

#         return jsonify({
#             "place": place,
#             "valid": valid,
#             "source": "Wikipedia"
#         })

#     except Exception as e:
#         print(f" Exception occurred: {str(e)}")
#         return jsonify({"error": str(e)}), 500

#     finally:
#         if driver:
#             try:
#                 driver.quit()
#             except Exception as e:
#                 print(f" Error closing driver: {e}")

# if __name__ == '__main__':
#     app.run(port=5001)
# from flask import Flask, request, jsonify
# import requests

# app = Flask(__name__)

# @app.route('/validate', methods=['POST'])
# def validate_place():
#     data = request.get_json()
#     place = data.get('place')

#     if not place:
#         return jsonify({"error": "No place provided"}), 400

#     try:
#         print(f" Validating place: {place}")
#         url = "https://en.wikipedia.org/w/api.php"
#         params = {
#             "action": "query",
#             "titles": place,
#             "format": "json"
#         }

#         response = requests.get(url, params=params)
#         data = response.json()

#         pages = data.get("query", {}).get("pages", {})
#         page_id = next(iter(pages))

#         valid = page_id != "-1"

#         return jsonify({
#             "place": place,
#             "valid": valid,
#             "source": "Wikipedia"
#         })

#     except Exception as e:
#         print(f"Exception occurred: {str(e)}")
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(port=5001)
