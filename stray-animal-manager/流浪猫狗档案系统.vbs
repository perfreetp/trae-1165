Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & Replace(WScript.ScriptFullName, WScript.ScriptName, "") & "启动应用.bat" & Chr(34), 7, False
