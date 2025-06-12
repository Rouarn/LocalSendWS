@echo off
setlocal enabledelayedexpansion

:: Get current directory
set "currentDir=%cd%"

:: File patterns to delete
set "filePattern1=*.controller.spec.ts"
set "filePattern2=*.service.spec.ts"

:: Directories to exclude (case-insensitive)
set "excludeDirs=node_modules dist"

echo Scanning directory: %currentDir%
echo Deleting files matching:
echo - %filePattern1%
echo - %filePattern2%
echo Excluding directories: %excludeDirs%
echo.

:: Recursively find and delete matching files (skip excluded dirs)
for /r "%currentDir%" %%f in (%filePattern1% %filePattern2%) do (
    set "filePath=%%f"
    set "shouldDelete=1"

    :: Check if file is inside excluded dirs
    for %%x in (%excludeDirs%) do (
        echo "!filePath!" | find /i "%%x" >nul && set "shouldDelete=0"
    )

    :: Delete if not in excluded dir
    if !shouldDelete! equ 1 (
        if exist "%%f" (
            del /q "%%f"
            echo Deleted: %%f
        )
    )
)

echo.
echo Operation completed.
pause
