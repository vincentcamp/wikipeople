import logging
from flask import Flask, request, render_template, session, redirect, url_for, current_app, jsonify
from flask_session import Session
import json
import random
import time
from requests.exceptions import JSONDecodeError
from difflib import SequenceMatcher
from datetime import datetime, timedelta
import requests
import os

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

def load_occupation_data():
    """
    Load occupation data from the JSON file.
    """
    try:
        with current_app.open_resource('static/occupations.json') as f:
            occupation_data = json.load(f)
        logging.info(f"Loaded {len(occupation_data)} occupations from JSON.")
        return occupation_data
    except Exception as e:
        logging.error(f"Failed to load occupation data: {e}")
        return []

def find_occupation_qid(occupation_label, occupation_data):
    #dictionary
    occupation_dict = {occ["occupationLabel"].lower(): occ["occupationQID"] 
                        for occ in occupation_data}
    target_label = occupation_label.lower()
    return occupation_dict.get(target_label, None)

def load_college_data():
    """
    Load college data from the JSON file.
    """
    try:
        with current_app.open_resource('static/colleges.json') as f:  # Ensure the path is correct
            college_data = json.load(f)
        logging.info("Successfully loaded college data from JSON.")
        return college_data
    except Exception as e:
        logging.error(f"Failed to load college data: {e}")
        return []

def find_college_qid_in_data(college_name, college_data):
    """
    Find the college QID in the loaded data based on the college name.
    """
    logging.info(f"Searching for '{college_name}' in local college data.")
    for college in college_data:
        if college_name.lower() in [college['universityLabel'].lower()] + [alias.lower() for alias in college.get('aliases', '').split(", ")]:
            logging.info(f"Match found in local data for '{college_name}': {college['qid']}")
            return college['qid']
    logging.info(f"No match found in local data for '{college_name}'.")
    return None

def find_college_name_from_qid(college_qid, college_data):
  """
  Finds the college name nased on college QID.
  """
  logging.info(f"Searching for college name with QID '{college_qid}' in local data.")
  for college in college_data:
    if college['qid'] == college_qid:
      logging.info(f"Match found in local data for QID '{college_qid}': {college['universityLabel']}")
      return college['universityLabel']
  logging.info(f"No match found in local data for QID '{college_qid}'.")
  return "N/A"


def get_college_qid_from_wikidata(college_name):
    logging.info(f"Querying Wikidata for college name: {college_name}")

    # Fetch colleges that match the name or its aliases, ordered by sitelink count
    primary_query = """
    SELECT ?college ?label (COUNT(?sitelink) AS ?count) WHERE {{
        ?college wdt:P31 wd:Q3918; 
                 rdfs:label|skos:altLabel ?label.
        OPTIONAL {{ ?college schema:about ?sitelink. ?sitelink schema:isPartOf <https://en.wikipedia.org/>. }}
        FILTER(LANG(?label) = "en" && CONTAINS(LCASE(?label), LCASE("{}"))).
    }}
    GROUP BY ?college ?label
    ORDER BY DESC(?count)
    """.format(college_name)
    response = requests.get("https://query.wikidata.org/sparql", params={"query": primary_query, "format": "json"})
    if response.ok:
        data = response.json()
    else:
        logging.error(f"Failed to query Wikidata: {response.status_code}, {response.text}")
        return None

    best_match = None
    highest_similarity = -1
    for item in data['results']['bindings']:
        name = item['label']['value']
        similarity = SequenceMatcher(None, college_name.lower(), name.lower()).ratio()
        if similarity > highest_similarity:
            best_match = item['college']['value'].split('/')[-1]
            highest_similarity = similarity

    if best_match:
        logging.info(f"Best match from Wikidata for '{college_name}': {best_match} (similarity: {highest_similarity})")
    else:
        logging.info(f"No match found on Wikidata for '{college_name}'.")
    return best_match

def get_college_qid(college_name):
    """
    Main function to get the college QID based on the college name.
    """
    college_data = load_college_data()
    college_qid = find_college_qid_in_data(college_name, college_data)
    if college_name == "":
        return 1
    elif college_qid:
        return college_qid
    else:
        return get_college_qid_from_wikidata(college_name)
  
def deduce_birth_year(grad_year, degree):
    degree_ages = {
        'Bachelor': 22,
        'Master': 24,
        'PhD': 30,
        'Doctorate': 30,
    }

    default_age = 22

    age_at_graduation = degree_ages.get(degree, default_age)

    birth_year = grad_year - age_at_graduation
    return birth_year

def execute_sparql_query(year_range, college_qid, occupation_qid, random_mode=False):
    logging.debug(f"Executing query with college QID: '{college_qid}', occupation QID: '{occupation_qid}', random mode: {random_mode}")

    occupation_condition = f"?person wdt:P106 wd:{occupation_qid}." if occupation_qid else ""
    
    order_by_clause = "ORDER BY RAND()" if random_mode else ""

def execute_sparql_query(year_range, college_qid, occupation_qid, random_mode=False):
    logging.debug(f"Executing query with college QID: '{college_qid}', occupation QID: '{occupation_qid}', random mode: {random_mode}")
   
    if college_qid == 1:
        college_condition = "" if college_qid == "" else f"OPTIONAL {{ ?person wdt:P69/ps:P69/wdt:P361* wd:{college_qid}. }}"
    else:
        college_condition =  f"p:P69/ps:P69/wdt:P361* wd:{college_qid}."

    occupation_condition = f"?person wdt:P106 wd:{occupation_qid}." if occupation_qid else ""
    
    order_by_clause = "ORDER BY RAND()" if random_mode else ""

    query_parts = f"""
    ?person wdt:P569 ?dob;
    {college_condition}
    {occupation_condition}
    OPTIONAL {{ ?person wdt:P69 ?institution. }}
    OPTIONAL {{ ?person wdt:P512 ?degree. }}
    OPTIONAL {{ ?person p:P512/ps:P512 ?_degree; pq:P582 ?gradYear. }}
    ?article schema:about ?person; schema:isPartOf <https://en.wikipedia.org/>.
    OPTIONAL {{ ?person schema:description ?description. FILTER(LANG(?description) = "en") }}
    """

    query = f"""
    SELECT DISTINCT ?person ?personLabel ?dob ?article ?institution ?degreeLabel ?gradYear ?description ?occupationLabel WHERE {{
        {query_parts}
        SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        FILTER(YEAR(?dob) >= {year_range[0]} && YEAR(?dob) <= {year_range[1]})
    }}
    {order_by_clause}
    """

    try:
        response = requests.get("https://query.wikidata.org/sparql", params={"query": query, "format": "json"})
        if response.status_code == 429:
            logging.warning('Rate limit hit, waiting before retrying...')
            time.sleep(10)
            return execute_sparql_query(year_range, college_qid, occupation_qid)
        elif response.status_code != 200:
            logging.error(f"Unexpected status code: {response.status_code}, response: {response.text}")
            return []
        data = response.json()
    except JSONDecodeError:
        logging.error(f"Error parsing JSON from response: {response.text}")
        return []
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return []
    for item in data["results"]["bindings"]:
        person_qid = item["person"]["value"]
        description = item.get("description", {}).get("value", "N/A")
        occupation = item.get("occupationLabel", {}).get("value", "N/A")
        dob = item.get("dob", {}).get("value")
        formatted_dob = datetime.strptime(dob, "%Y-%m-%dT%H:%M:%SZ").strftime("%B %d, %Y") if dob else None
        if not formatted_dob and 'gradYear' in item:
            grad_year = int(item['gradYear']['value'][:4])
            degree = item.get('degreeLabel', {}).get('value', '')
            birth_year = deduce_birth_year(grad_year, degree)
            formatted_dob = f"January 1, {birth_year}"
        elif not formatted_dob:
            formatted_dob = "January 1, 1900"
    seen_person_ids = set()
    filtered_person_info = []

    college_data = load_college_data()
    college_name = find_college_name_from_qid(college_qid, college_data)

    for item in data["results"]["bindings"]:
        person_qid = item["person"]["value"]
        if person_qid not in seen_person_ids:
            dob = item.get("dob", {}).get("value")
            formatted_dob = datetime.strptime(dob, "%Y-%m-%dT%H:%M:%SZ").strftime("%B %d, %Y") if dob else "N/A"

            description = item.get("description", {}).get("value", "N/A")
          
            #this part didn't result to occupation, instition and degree, so temporarily the education is replaced to institution
            occupation = item.get("occupationLabel", {}).get("value", "N/A")
            education_entries = []
            if "institution" in item:
                institution_name = item["institution"].get("value", "Unknown institution")
                degree_name = item.get("degreeWLabel", {}).get("value", "Unknown degree")
                education_entries.append(f"{institution_name} - {degree_name}")
            education_info = "; ".join(education_entries) if education_entries else ""
            #if no input for college
            if college_qid == 1:
                institution = [char for char in institution_name if char.isdigit()]
                institution = ''.join(institution)
                institution = "Q" + institution 
                college_name = find_college_name_from_qid(institution, college_data)
    
            filtered_person_info.append({
                "person": person_qid,
                "personLabel": item["personLabel"]["value"],
                "dateOfBirth": formatted_dob,
                "description": description,
                "occupation": occupation,
                "wikipediaUrl": item.get("article", {}).get("value"),
                "education": college_name #college_name is used for the meantime
            })
            seen_person_ids.add(person_qid)
    logging.debug(f"SPARQL Query: {query}")
    return filtered_person_info

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        # Store search criteria in the session for later use
        session['search_criteria'] = {
            'mode': request.form.get('mode'),
            'start_year': request.form['start_year'],
            'end_year': request.form['end_year'],
            'college': request.form.get('college', '').strip(),
            'occupation_label': request.form.get('occupation', '').strip().lower()
        }

        mode = session['search_criteria']['mode']
        start_year = session['search_criteria']['start_year']
        end_year = session['search_criteria']['end_year']
        college = session['search_criteria']['college']
        occupation_label = session['search_criteria']['occupation_label']

        # Initialize person_info to an empty list to ensure it has a value
        person_info = []
        
        occupation_data = load_occupation_data()
        occupation_qid = find_occupation_qid(occupation_label, occupation_data)
        
        college_qid = get_college_qid(college)
        if not college_qid:
            logging.warning(f"No QID found for {college}")
            return "College not found on Wikidata.", 404
        
        # Execute the SPARQL query to get person_info regardless of mode,
        # but only proceed if we have a college_qid
        person_info = execute_sparql_query((int(start_year), int(end_year)), college_qid, occupation_qid)
        if mode == 'random':
            session.setdefault('history', [])
            persons_with_wikipedia = [person for person in person_info if person.get('wikipediaUrl')]
            if persons_with_wikipedia:
                random_person = random.choice(persons_with_wikipedia)
                wikipedia_url = random_person['wikipediaUrl']
                # Assuming 'person' is a dictionary that contains at least 'wikipediaUrl'
                session['history'].append(random_person)  # Store the whole person dict for now
                session.modified = True
                return render_template('embed.html', wikipedia_url=wikipedia_url, start_year=start_year, end_year=end_year, college=college, occupation=occupation_label)
            else:
                return render_template('no_result.html', message="No suitable random selection found.")        
        # For database mode, or if random mode didn't find a suitable candidate
        return render_template('result.html', person_info=person_info, start_year=start_year, end_year=end_year, college=college, occupation=occupation_label)
    else:
        # Load the form with any existing session data
        return render_template('index.html', start_year=session.get('start_year', ''), end_year=session.get('end_year', ''), college=session.get('college', ''), occupation=session.get('occupation', ''))
@app.route('/previous', methods=['POST'])
def go_previous():
    if 'history' in session and len(session['history']) > 1:
        session['history'].pop()
        session.modified = True
        previous_person = session['history'][-1]
        wikipedia_url = previous_person['wikipediaUrl']  # Retrieve URL from the last entry
        return render_template('embed.html', wikipedia_url=wikipedia_url)
    else:
        return redirect(url_for('home'))
    
@app.route('/next', methods=['POST'])
def go_next():
    if 'search_criteria' in session:
        criteria = session['search_criteria']
        person_info = execute_sparql_query(
            (int(criteria['start_year']), int(criteria['end_year'])),
            get_college_qid(criteria['college']),
            find_occupation_qid(criteria['occupation_label'], load_occupation_data()),
            random_mode=True
        )
        if person_info:
            # Attempt to ensure a different selection is made
            attempt = 0
            while attempt < 5:  # Limit attempts to avoid infinite loops
                random_person = random.choice(person_info)
                if not session['history'] or (session['history'] and session['history'][-1]['wikipediaUrl'] != random_person['wikipediaUrl']):
                    wikipedia_url = random_person['wikipediaUrl']
                    session['history'].append(random_person)
                    session.modified = True
                    return render_template('embed.html', wikipedia_url=wikipedia_url, **criteria)
                attempt += 1
            return render_template('no_result.html', message="Unable to find a new random selection.")
        else:
            return render_template('no_result.html', message="No suitable random selection found.")
    else:
        # Redirect to home if there are no search criteria in session (e.g., direct access to /next)
        return redirect(url_for('home'))

@app.route('/new', methods=['POST'])
def new_search():
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)