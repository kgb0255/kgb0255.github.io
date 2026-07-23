import os
import re
import requests

TOKEN = os.environ["APS_PUBLICATION_LIBRARY_TOKEN"]
LIBRARY_ID = "W4_syxkBRleeBkrU4MumLA"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Step 1: Get bibcodes from library
r = requests.get(
    f"https://api.adsabs.harvard.edu/v1/biblib/libraries/{LIBRARY_ID}",
    headers=headers,
    params={"rows": 500},
)
r.raise_for_status()
bibcodes = r.json()["documents"]

if not bibcodes:
    print("No bibcodes found in library.")
    exit(0)

# Step 2: Fetch paper details
r = requests.post(
    "https://api.adsabs.harvard.edu/v1/search/bigquery",
    headers={**headers, "Content-Type": "big-query/csv"},
    params={
        "q": "*:*",
        "fl": "title,author,year,pub,doi,bibcode,identifier",
        "rows": 500,
        "sort": "date desc",
    },
    data="bibcode\n" + "\n".join(bibcodes),
)
r.raise_for_status()
papers = r.json()["response"]["docs"]

def format_author(name):
    """Convert 'Last, First' to 'First Last', bold if last name is Kwon."""
    if ", " in name:
        last, first = name.split(", ", 1)
        formatted = f"{first} {last}"
    else:
        last, formatted = name, name
    if last == "Kwon":
        return f"<strong>{formatted}</strong>"
    return formatted


# Step 3: Build HTML list items
items = []
for p in papers:
    title = p.get("title", ["Untitled"])[0]
    authors = p.get("author", [])
    formatted = [format_author(a) for a in authors]
    kwon_idx = next((i for i, a in enumerate(authors) if a.split(", ")[0] == "Kwon"), None)

    if len(formatted) <= 6:
        author_str = ", ".join(formatted)
    elif kwon_idx is not None and kwon_idx >= 6:
        # Kwon would be cut off — show first author + et al. with Kwon noted
        author_str = formatted[0] + ", et al. (including " + formatted[kwon_idx] + ")"
    else:
        author_str = ", ".join(formatted[:6]) + ", et al."
    year = p.get("year", "")
    journal = p.get("pub", "")
    bibcode = p.get("bibcode", "")
    identifiers = p.get("identifier", [])

    ads_link = f"https://ui.adsabs.harvard.edu/abs/{bibcode}"

    arxiv_id = next(
        (i.replace("arXiv:", "") for i in identifiers if i.startswith("arXiv:")),
        None,
    )
    arxiv_link = f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else None

    icon_ads = (
        f'<a href="{ads_link}" target="_blank" rel="noopener">'
        f'<img src="assets/ads_partial_logo_dark_background.svg" '
        f'alt="NASA ADS" style="height:16px; vertical-align:middle; margin-right:6px;"></a>'
    )
    icon_arxiv = (
        f'<a href="{arxiv_link}" target="_blank" rel="noopener">'
        f'<img src="assets/arxiv-logo.svg" '
        f'alt="arXiv" style="height:16px; vertical-align:middle;"></a>'
        if arxiv_link else ""
    )

    items.append(
        f'    <li>\n'
        f'      {author_str}<br>\n'
        f'      {title}. <em>{journal}</em>, {year}.<br>\n'
        f'      {icon_ads}{icon_arxiv}\n'
        f'    </li>'
    )

html_block = (
    "  <!-- ADS_PUBLICATIONS_START -->\n"
    "  <ul class=\"plain\">\n"
    + "\n".join(items) + "\n"
    "  </ul>\n"
    "  <!-- ADS_PUBLICATIONS_END -->"
)

# Step 4: Replace section in research.html
with open("research.html", "r") as f:
    content = f.read()

new_content = re.sub(
    r"<!-- ADS_PUBLICATIONS_START -->.*?<!-- ADS_PUBLICATIONS_END -->",
    html_block,
    content,
    flags=re.DOTALL,
)

with open("research.html", "w") as f:
    f.write(new_content)

print(f"Updated {len(papers)} publications.")
