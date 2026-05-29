import re

files = ['UserDashboard.jsx', 'AdminDashboard.jsx', 'ClientDashboard.jsx']
for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Replace the API URL
    content = re.sub(
        r'const API = .*',
        'const API = "https://watt-guard.up.railway.app";',
        content
    )
    
    with open(file, 'w') as f:
        f.write(content)
    print(f"Fixed {file}")
