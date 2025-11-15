import os

# Specify the directory
directory = '/problem'

# List all files in the directory
files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]

print(files)

directory = '/submission'

# List all files in the directory
files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]

print(files)


print(45.5 + 10.0)