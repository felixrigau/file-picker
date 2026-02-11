const NAME_CELL_FOLDER = "cursor-pointer font-medium";
const NAME_CELL_FILE = "cursor-default";

/** Name cell classes by node type (folder vs file) */
export const NAME_CELL_CLASSES_BY_TYPE = {
  folder: NAME_CELL_FOLDER,
  file: NAME_CELL_FILE,
} as const;
