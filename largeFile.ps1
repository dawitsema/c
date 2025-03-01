$FILE = "this.md"

# Set the new date range
$startDate = Get-Date "2025-03-01"
$endDate = Get-Date "2025-04-30"

# Generate a list of unique random dates within the range
$allDates = @()
$daysInRange = ($endDate - $startDate).Days + 1
$numberOfDaysToUse = Get-Random -Minimum 20 -Maximum $daysInRange  # Random number of days to pick

while ($allDates.Count -lt $numberOfDaysToUse) {
    $randomOffset = Get-Random -Minimum 0 -Maximum $daysInRange
    $randomDate = $startDate.AddDays($randomOffset).Date

    if (-not ($allDates -contains $randomDate)) {
        $allDates += $randomDate
    }
}

# Sort dates for consistent ordering (optional)
$allDates = $allDates | Sort-Object

foreach ($currentStartDate in $allDates) {
    # Random number of commits for the current random day (1 to 6)
    $commitsForToday = Get-Random -Minimum 1 -Maximum 7

    for ($i = 0; $i -lt $commitsForToday; $i++) {
        # Append random data
        $randomNumber = Get-Random -Minimum 1 -Maximum 100
        "$randomNumber" | Out-File -Append -Encoding utf8 $FILE

        # Commit with the current random date + random time
        $commitTime = $currentStartDate.AddHours((Get-Random -Minimum 0 -Maximum 23)).AddMinutes((Get-Random -Minimum 0 -Maximum 59))
        $commitDate = $commitTime.ToString("yyyy-MM-dd HH:mm:ss")

        git add .
        git commit -m "m" --date="$commitDate"
    }

    git push origin main
}
