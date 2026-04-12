# Design Guard CLI Demo
# Run: bash scripts/demo-setup.sh

Output .github/assets/demo.gif

Set FontSize 14
Set Width 1200
Set Height 650
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms
Set Padding 20

# 1. Show all commands
Type "npx tsx src/index.ts --help"
Enter
Sleep 3s

# 2. Show the generated DESIGN.md (design system output)
Type "head -40 DESIGN.md"
Enter
Sleep 5s

# 3. Show quota with visual bars
Type "npx tsx src/index.ts quota"
Enter
Sleep 3s

# 4. List screens available for preview
Type "npx tsx src/index.ts preview"
Enter
Sleep 3s

# 5. Preview a specific screen
Type "npx tsx src/index.ts preview homepage"
Enter
Sleep 3s

# 6. Show guided workflow
Type "npx tsx src/index.ts workflow redesign"
Enter
Sleep 4s

Sleep 1s
