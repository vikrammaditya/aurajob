import os
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import re
from datetime import datetime

# Configuration
KEYWORDS = [
    r'\bai\b', r'artificial intelligence', r'\bml\b', r'machine learning',
    r'data engineer', r'data scientist', r'data analyst', r'deep learning',
    r'nlp', r'natural language processing', r'computer vision',
    r'data analytics', r'data pipeline', r'analytics engineer', r'prompt engineer'
]



GEO_MAPPING = {
    'india': 'India',
    'europe': 'Europe',
    'germany': 'Europe',
    'france': 'Europe',
    'netherlands': 'Europe',
    'united kingdom': 'Europe',
    'uk': 'Europe',
    'ireland': 'Europe',
    'canada': 'Canada',
    'united states': 'US',
    'us': 'US',
    'usa': 'US',
    'middle east': 'Middle East',
    'uae': 'Middle East',
    'dubai': 'Middle East',
    'saudi': 'Middle East',
    'remote': 'Remote'
}

def matches_keywords(text):
    text_lower = text.lower()
    for kw in KEYWORDS:
        if re.search(kw, text_lower):
            return True
    return False

def determine_geo(location):
    if not location:
        return 'Remote'
    loc_lower = location.lower()
    for key, value in GEO_MAPPING.items():
        if key in loc_lower:
            return value
    return 'Other'

def determine_job_type(title, description, location, source):
    text = (title + " " + description + " " + (location or "")).lower()
    if 'hybrid' in text:
        return 'Hybrid'
    elif 'remote' in text or 'work from home' in text or 'wfh' in text or source in ['Remotive', 'We Work Remotely']:
        return 'Remote'
    else:
        return 'In-office'

def clean_description(desc_html):
    # Basic HTML tag stripping
    clean = re.sub(r'<[^>]+>', ' ', desc_html)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean[:500] + "..." if len(clean) > 500 else clean

def fetch_json(url):
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching JSON from {url}: {e}")
        return None

def fetch_rss(url):
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read()
    except Exception as e:
        print(f"Error fetching RSS from {url}: {e}")
        return None

def parse_remotive():
    jobs = []
    print("Fetching from Remotive...")
    # Fetch Data jobs
    data_res = fetch_json("https://remotive.com/api/remote-jobs?category=data")
    # Fetch Software Dev jobs to filter for ML/AI
    dev_res = fetch_json("https://remotive.com/api/remote-jobs?category=software-dev")
    
    raw_jobs = []
    if data_res and 'jobs' in data_res:
        raw_jobs.extend(data_res['jobs'])
    if dev_res and 'jobs' in dev_res:
        raw_jobs.extend(dev_res['jobs'])
        
    for rj in raw_jobs:
        title = rj.get('title', '')
        company = rj.get('company_name', '')
        description = rj.get('description', '')
        

            
        if not (matches_keywords(title) or matches_keywords(description)):
            continue
            
        location = rj.get('candidate_required_location', 'Remote')
        geo = determine_geo(location)
        job_type = determine_job_type(title, description, location, 'Remotive')
        
        # Tags
        tags = rj.get('tags', [])
        if not tags:
            tags = ['Remote', 'Data']
            
        # Parse date
        pub_date = rj.get('publication_date', '')
        # Formats like "2026-05-21T09:00:00"
        
        jobs.append({
            "id": f"remotive-{rj.get('id')}",
            "title": title,
            "company": company,
            "location": location,
            "geo_category": geo,
            "job_type": job_type,
            "description": clean_description(description),
            "url": rj.get('url', ''),
            "salary": rj.get('salary', 'Not specified') or 'Not specified',
            "tags": tags,
            "date_posted": pub_date,
            "source": "Remotive"
        })
    print(f"Parsed {len(jobs)} jobs from Remotive.")
    return jobs

def parse_arbeitnow():
    jobs = []
    print("Fetching from Arbeitnow...")
    res = fetch_json("https://www.arbeitnow.com/api/job-board-api")
    if not res or 'data' not in res:
        return jobs
        
    for rj in res['data']:
        title = rj.get('title', '')
        company = rj.get('company_name', '')
        description = rj.get('description', '')
        

            
        if not (matches_keywords(title) or matches_keywords(description)):
            continue
            
        location = rj.get('location', '')
        geo = determine_geo(location)
        job_type = determine_job_type(title, description, location, 'Arbeitnow')
        
        tags = rj.get('tags', [])
        
        jobs.append({
            "id": f"arbeitnow-{rj.get('slug')}",
            "title": title,
            "company": company,
            "location": location,
            "geo_category": geo,
            "job_type": job_type,
            "description": clean_description(description),
            "url": rj.get('url', ''),
            "salary": 'Not specified',
            "tags": tags,
            "date_posted": datetime.now().isoformat(), # Arbeitnow API doesn't always have simple date fields
            "source": "Arbeitnow"
        })
    print(f"Parsed {len(jobs)} jobs from Arbeitnow.")
    return jobs

def parse_wwr():
    jobs = []
    print("Fetching from We Work Remotely...")
    xml_data = fetch_rss("https://weworkremotely.com/categories/remote-programming-jobs.rss")
    if not xml_data:
        return jobs
        
    try:
        root = ET.fromstring(xml_data)
        for item in root.findall('.//item'):
            title_raw = item.find('title').text or ''
            # Format is typically: "Company Name: Job Title"
            company = 'Unknown'
            title = title_raw
            if ':' in title_raw:
                parts = title_raw.split(':', 1)
                company = parts[0].strip()
                title = parts[1].strip()
                

                
            description = item.find('description').text or ''
            
            if not (matches_keywords(title) or matches_keywords(description)):
                continue
                
            link = item.find('link').text or ''
            pub_date = item.find('pubDate').text or ''
            
            # WWR RSS doesn't explicitly state location inside item elements, default to Remote
            location = 'Remote'
            geo = determine_geo(location)
            job_type = 'Remote'
            
            jobs.append({
                "id": f"wwr-{hash(link)}",
                "title": title,
                "company": company,
                "location": location,
                "geo_category": geo,
                "job_type": job_type,
                "description": clean_description(description),
                "url": link,
                "salary": 'Not specified',
                "tags": ['Remote', 'Development'],
                "date_posted": pub_date,
                "source": "We Work Remotely"
            })
    except Exception as e:
        print(f"Error parsing WWR RSS: {e}")
        
    print(f"Parsed {len(jobs)} jobs from We Work Remotely.")
    return jobs

def merge_and_deduplicate(api_jobs, web_jobs):
    all_jobs = api_jobs + web_jobs
    seen = set()
    deduped = []
    
    for job in all_jobs:
        # Deduplication key: company + title (slugified)
        key = (job['company'].lower().strip(), job['title'].lower().strip())
        if key not in seen:
            seen.add(key)
            deduped.append(job)
            
    # Sort by date posted (newest first, if parseable, or just keep order)
    def get_sort_key(j):
        try:
            # Try parsing ISO format
            return datetime.fromisoformat(j['date_posted'].replace('Z', '+00:00')).timestamp()
        except Exception:
            return 0
            
    deduped.sort(key=get_sort_key, reverse=True)
    return deduped

def main():
    print("Starting Job Fetcher Pipeline...")
    
    # 1. Fetch remote API jobs
    remotive_jobs = parse_remotive()
    arbeitnow_jobs = parse_arbeitnow()
    wwr_jobs = parse_wwr()
    scraped_jobs = remotive_jobs + arbeitnow_jobs + wwr_jobs
    
    # 2. Read Agent Web Discovered Jobs (e.g. NVIDIA, Goldman Sachs, etc. discovered via search_web tool)
    web_jobs = []
    web_discovered_path = os.path.join('data', 'web_discovered_jobs.json')
    if os.path.exists(web_discovered_path):
        try:
            with open(web_discovered_path, 'r', encoding='utf-8') as f:
                web_jobs = json.load(f)
            print(f"Loaded {len(web_jobs)} web discovered jobs.")
        except Exception as e:
            print(f"Error loading web discovered jobs: {e}")
            
    # 3. Merge and Deduplicate
    final_jobs = merge_and_deduplicate(scraped_jobs, web_jobs)
    
    # 4. Save to jobs.json
    os.makedirs('data', exist_ok=True)
    jobs_json_path = os.path.join('data', 'jobs.json')
    with open(jobs_json_path, 'w', encoding='utf-8') as f:
        json.dump(final_jobs, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully pipeline completed. Total jobs saved: {len(final_jobs)}")

if __name__ == '__main__':
    main()
