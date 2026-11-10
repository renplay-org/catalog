# Renplay: Innocent Witches ships its own changes to Ren'Py, and its scripts call them: begin_scan and
# end_scan around reading the saves, and a save timer (saveprofile) that does nothing unless the
# developer turns it on. The web engine is Ren'Py's own, without them, so the game stopped before its
# main menu. These stand in for them when they are missing.

init -999 python:

    import types
    import renpy.savelocation as _renplay_savelocation

    if not hasattr(_renplay_savelocation, "begin_scan"):
        _renplay_savelocation.begin_scan = lambda: True

    if not hasattr(_renplay_savelocation, "end_scan"):
        _renplay_savelocation.end_scan = lambda: None

    if not hasattr(renpy, "saveprofile"):
        renpy.saveprofile = types.SimpleNamespace(flush=lambda: None)
