import urllib.request

pages = ['', 'login', 'clients', 'weekly-reports', 'account-health', 
         'upsell', 'cross-sell', 'tasks', 'reports', 'notifications', 
         'ai-recommendations', 'settings']

for p in pages:
    try:
        r = urllib.request.urlopen(f"http://localhost:3099/{p}")
        print(f"{p or 'dashboard'}: {r.status}")
    except Exception as e:
        print(f"{p or 'dashboard'}: ERROR - {e}")
