import os

files = {
    'Tanaka': 'frontend/src/pages/MarketingOfflineTanaka.jsx',
    'Banua': 'frontend/src/pages/MarketingOfflineBanua.jsx'
}

with open('/tmp/missing_tabs.txt', 'r') as f:
    missing_code = f.read()

for branch, filepath in files.items():
    with open(filepath, 'r') as f:
        content = f.read()

    code_to_insert = missing_code
    if branch == 'Tanaka':
        code_to_insert = code_to_insert.replace('/marketing-offline/', '/marketing-offline-tanaka/')
        code_to_insert = code_to_insert.replace('cabang Banua', 'cabang Tanaka')
        
    if "=== TAB CUSTOMERS ===" not in content:
        target = "{/* === TAB PROMO === */}"
        if target in content:
            new_content = content.replace(target, code_to_insert + "\n                " + target)
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Patched {branch} successfully.")
        else:
            print(f"Could not find target in {branch}.")
    else:
        print(f"{branch} already has customers tab.")

