import sys

with open('/home/ubuntu/megafort_source/tailwind.config.ts', 'r') as f:
    content = f.read()

if "magenta" not in content:
    magenta_config = """        magenta: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },"""
    content = content.replace("colors: {", "colors: {\n" + magenta_config)

with open('/home/ubuntu/megafort_source/tailwind.config.ts', 'w') as f:
    f.write(content)
