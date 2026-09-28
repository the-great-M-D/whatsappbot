MOBILE PYTHON SCRIPTS

Put your Python scripts in this directory.

1. Add the exact script filename to .env:
   DEV_ALLOWED_SCRIPTS=my_script.py,another.py

2. Restart the bot.

3. Run from WhatsApp as the owner:
   !py my_script.py
   !py my_script.py argument1 argument2

Rules:
- Scripts must stay inside scripts/.
- The bot runs them with the Termux "python" command.
- Script arguments are allowed.
- Only filenames listed in DEV_ALLOWED_SCRIPTS can run.
- Output is limited by DEV_MAX_OUTPUT.
- Execution is stopped after DEV_TIMEOUT_MS.

Example:
   scripts/backup.py

.env:
   DEV_ALLOWED_SCRIPTS=backup.py

Then:
   !py backup.py
