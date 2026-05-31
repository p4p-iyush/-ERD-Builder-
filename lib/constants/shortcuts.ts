export interface ShortcutDef {
  keys: string;
  label: string;
  description: string;
  category: "general" | "edit" | "view" | "table";
}

export const SHORTCUTS: ShortcutDef[] = [
  // General
  { keys: "Ctrl+S",       label: "Save",          description: "Save diagram",             category: "general" },
  { keys: "Ctrl+Z",       label: "Undo",          description: "Undo last action",         category: "general" },
  { keys: "Ctrl+Shift+Z", label: "Redo",          description: "Redo last action",         category: "general" },
  { keys: "Ctrl+/",       label: "Shortcuts",     description: "Show keyboard shortcuts",  category: "general" },
  // Edit
  { keys: "Ctrl+C",       label: "Copy",          description: "Copy selected tables",     category: "edit"    },
  { keys: "Ctrl+V",       label: "Paste",         description: "Paste tables",             category: "edit"    },
  { keys: "Ctrl+D",       label: "Duplicate",     description: "Duplicate selected tables",category: "edit"    },
  { keys: "Delete",       label: "Delete",        description: "Delete selected items",    category: "edit"    },
  { keys: "Ctrl+A",       label: "Select All",    description: "Select all tables",        category: "edit"    },
  { keys: "Escape",       label: "Deselect",      description: "Deselect all",             category: "edit"    },
  // View
  { keys: "Ctrl+Shift+F", label: "Fit View",      description: "Fit diagram to screen",   category: "view"    },
  { keys: "Ctrl+=",       label: "Zoom In",       description: "Zoom in",                  category: "view"    },
  { keys: "Ctrl+-",       label: "Zoom Out",      description: "Zoom out",                 category: "view"    },
  { keys: "Ctrl+F",       label: "Search",        description: "Search tables",            category: "view"    },
  { keys: "Ctrl+`",       label: "SQL Preview",   description: "Toggle SQL preview",       category: "view"    },
  // Table
  { keys: "Ctrl+N",       label: "New Table",     description: "Add a new table",          category: "table"   },
  { keys: "F2",           label: "Rename",        description: "Rename selected table",    category: "table"   },
];