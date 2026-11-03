# Renplay: Harem Hotel was made with Ren'Py 7, whose Python 2 could order numbers and text
# together (numbers first). Ren'Py 8 runs Python 3, which refuses. When sorting fails for that
# reason, it sorts again in Python 2's order.

init -999 python:

    def _renplay_py2_key(v):
        if v is None:
            return (0, "", 0)
        if isinstance(v, (int, float)):
            return (1, "", v)
        if isinstance(v, (tuple, list)):
            return (2, type(v).__name__, [_renplay_py2_key(i) for i in v])
        return (2, type(v).__name__, v)

    def _renplay_py2_sorting(sort):
        def sort_py2(*args, **kwargs):
            try:
                return sort(*args, **kwargs)
            except TypeError:
                key = kwargs.get("key")
                kwargs["key"] = (lambda v: _renplay_py2_key(key(v))) if key else _renplay_py2_key
                return sort(*args, **kwargs)
        return sort_py2

    sorted = _renplay_py2_sorting(sorted)
    renpy.revertable.RevertableList.sort = _renplay_py2_sorting(renpy.revertable.RevertableList.sort)
