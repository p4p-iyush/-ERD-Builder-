import { v4 as uuidv4 } from "uuid";
import type { DiagramData, TableNode } from "../../types/diagram";
import type { Column } from "../../types/column";

type TemplateId = "ecommerce" | "blog" | "school" | "chat";

interface Template {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  tableCount: number;
  tags: string[];
  getDiagram: () => DiagramData;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const col = (
  overrides: Partial<Column> & Pick<Column, "name" | "dataType">
): Column => ({
  id: uuidv4(),
  isPrimaryKey: false,
  isForeignKey: false,
  isUnique: false,
  isNullable: true,
  order: 0,
  ...overrides,
});

const pkCol = (name = "id"): Column =>
  col({
    name,
    dataType: "uuid",
    isPrimaryKey: true,
    isUnique: true,
    isNullable: false,
    defaultValue: "uuid_generate_v4()",
  });

const tsCol = (name: string): Column =>
  col({ name, dataType: "timestamptz", isNullable: false });

const fkCol = (name: string, ref: string): Column =>
  col({ name, dataType: "uuid", isForeignKey: true,
        isNullable: false, referencedTable: ref });

function makeNode(
  id: string,
  tableName: string,
  columns: Column[],
  position: { x: number; y: number },
  color: string
): TableNode {
  return {
    id,
    type: "tableNode",
    position,
    data: {
      tableName,
      color,
      isHighlighted: false,
      isFaded: false,
      columns: columns.map((c, i) => ({ ...c, order: i })),
    },
  };
}

// ── Ecommerce template ────────────────────────────────────────────────────────

function getEcommerceDiagram(): DiagramData {
  const ids = {
    users:      uuidv4(),
    products:   uuidv4(),
    categories: uuidv4(),
    orders:     uuidv4(),
    orderItems: uuidv4(),
    addresses:  uuidv4(),
  };

  const nodes: TableNode[] = [
    makeNode(ids.users, "users", [
      pkCol(),
      col({ name: "email",       dataType: "varchar", isUnique: true,  isNullable: false }),
      col({ name: "full_name",   dataType: "varchar" }),
      col({ name: "avatar_url",  dataType: "text"    }),
      tsCol("created_at"),
    ], { x: 50,  y: 50  }, "#6270f1"),

    makeNode(ids.categories, "categories", [
      pkCol(),
      col({ name: "name",   dataType: "varchar", isNullable: false }),
      col({ name: "slug",   dataType: "varchar", isUnique: true,  isNullable: false }),
      fkCol("parent_id", "categories"),
    ], { x: 420, y: 50  }, "#10b981"),

    makeNode(ids.products, "products", [
      pkCol(),
      col({ name: "name",        dataType: "varchar",  isNullable: false }),
      col({ name: "slug",        dataType: "varchar",  isUnique: true, isNullable: false }),
      col({ name: "description", dataType: "text"      }),
      col({ name: "price",       dataType: "decimal",  isNullable: false }),
      col({ name: "stock",       dataType: "integer",  isNullable: false }),
      fkCol("category_id", "categories"),
      tsCol("created_at"),
    ], { x: 420, y: 280 }, "#f59e0b"),

    makeNode(ids.addresses, "addresses", [
      pkCol(),
      fkCol("user_id", "users"),
      col({ name: "street",  dataType: "varchar" }),
      col({ name: "city",    dataType: "varchar" }),
      col({ name: "country", dataType: "varchar" }),
      col({ name: "zip",     dataType: "varchar" }),
    ], { x: 50,  y: 340 }, "#3b82f6"),

    makeNode(ids.orders, "orders", [
      pkCol(),
      fkCol("user_id",    "users"),
      fkCol("address_id", "addresses"),
      col({ name: "status",      dataType: "varchar", isNullable: false }),
      col({ name: "total",       dataType: "decimal", isNullable: false }),
      tsCol("created_at"),
    ], { x: 50,  y: 620 }, "#ec4899"),

    makeNode(ids.orderItems, "order_items", [
      pkCol(),
      fkCol("order_id",   "orders"),
      fkCol("product_id", "products"),
      col({ name: "quantity", dataType: "integer", isNullable: false }),
      col({ name: "price",    dataType: "decimal", isNullable: false }),
    ], { x: 420, y: 600 }, "#8b5cf6"),
  ];

  return {
    nodes,
    edges: [
      { id: uuidv4(), source: ids.users,      target: ids.addresses,  type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.users,      target: ids.orders,     type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.categories, target: ids.products,   type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.orders,     target: ids.orderItems, type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.products,   target: ids.orderItems, type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.addresses,  target: ids.orders,     type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
    ],
  };
}

// ── Blog CMS template ────────────────────────────────────────────────────────

function getBlogDiagram(): DiagramData {
  const ids = {
    users: uuidv4(), posts: uuidv4(),
    tags: uuidv4(), postTags: uuidv4(), comments: uuidv4(),
  };

  const nodes: TableNode[] = [
    makeNode(ids.users, "users", [
      pkCol(),
      col({ name: "email",    dataType: "varchar", isUnique: true, isNullable: false }),
      col({ name: "username", dataType: "varchar", isUnique: true, isNullable: false }),
      col({ name: "bio",      dataType: "text" }),
      tsCol("created_at"),
    ], { x: 50,  y: 50  }, "#6270f1"),

    makeNode(ids.posts, "posts", [
      pkCol(),
      fkCol("author_id", "users"),
      col({ name: "title",      dataType: "varchar", isNullable: false }),
      col({ name: "slug",       dataType: "varchar", isUnique: true, isNullable: false }),
      col({ name: "content",    dataType: "text"    }),
      col({ name: "published",  dataType: "boolean" }),
      tsCol("published_at"),
      tsCol("created_at"),
    ], { x: 380, y: 50  }, "#f59e0b"),

    makeNode(ids.tags, "tags", [
      pkCol(),
      col({ name: "name", dataType: "varchar", isUnique: true, isNullable: false }),
      col({ name: "slug", dataType: "varchar", isUnique: true, isNullable: false }),
    ], { x: 50,  y: 380 }, "#10b981"),

    makeNode(ids.postTags, "post_tags", [
      pkCol(),
      fkCol("post_id", "posts"),
      fkCol("tag_id",  "tags"),
    ], { x: 380, y: 380 }, "#8b5cf6"),

    makeNode(ids.comments, "comments", [
      pkCol(),
      fkCol("post_id",   "posts"),
      fkCol("author_id", "users"),
      col({ name: "content", dataType: "text", isNullable: false }),
      tsCol("created_at"),
    ], { x: 720, y: 200 }, "#ec4899"),
  ];

  return {
    nodes,
    edges: [
      { id: uuidv4(), source: ids.users,    target: ids.posts,    type: "relationshipEdge", data: { relationshipType: "one-to-many"  } },
      { id: uuidv4(), source: ids.posts,    target: ids.postTags, type: "relationshipEdge", data: { relationshipType: "one-to-many"  } },
      { id: uuidv4(), source: ids.tags,     target: ids.postTags, type: "relationshipEdge", data: { relationshipType: "one-to-many"  } },
      { id: uuidv4(), source: ids.posts,    target: ids.comments, type: "relationshipEdge", data: { relationshipType: "one-to-many"  } },
      { id: uuidv4(), source: ids.users,    target: ids.comments, type: "relationshipEdge", data: { relationshipType: "one-to-many"  } },
    ],
  };
}

// ── School Management template ───────────────────────────────────────────────

function getSchoolDiagram(): DiagramData {
  const ids = {
    students: uuidv4(), teachers: uuidv4(), courses: uuidv4(),
    enrollments: uuidv4(), grades: uuidv4(),
  };

  const nodes: TableNode[] = [
    makeNode(ids.students, "students", [
      pkCol(),
      col({ name: "first_name", dataType: "varchar", isNullable: false }),
      col({ name: "last_name",  dataType: "varchar", isNullable: false }),
      col({ name: "email",      dataType: "varchar", isUnique: true }),
      col({ name: "dob",        dataType: "date"    }),
      tsCol("enrolled_at"),
    ], { x: 50,  y: 50  }, "#6270f1"),

    makeNode(ids.teachers, "teachers", [
      pkCol(),
      col({ name: "first_name", dataType: "varchar", isNullable: false }),
      col({ name: "last_name",  dataType: "varchar", isNullable: false }),
      col({ name: "email",      dataType: "varchar", isUnique: true }),
      col({ name: "department", dataType: "varchar" }),
    ], { x: 420, y: 50  }, "#10b981"),

    makeNode(ids.courses, "courses", [
      pkCol(),
      fkCol("teacher_id", "teachers"),
      col({ name: "name",        dataType: "varchar", isNullable: false }),
      col({ name: "code",        dataType: "varchar", isUnique: true }),
      col({ name: "description", dataType: "text"    }),
      col({ name: "credits",     dataType: "integer" }),
    ], { x: 420, y: 320 }, "#f59e0b"),

    makeNode(ids.enrollments, "enrollments", [
      pkCol(),
      fkCol("student_id", "students"),
      fkCol("course_id",  "courses"),
      tsCol("enrolled_at"),
    ], { x: 50,  y: 360 }, "#8b5cf6"),

    makeNode(ids.grades, "grades", [
      pkCol(),
      fkCol("enrollment_id", "enrollments"),
      col({ name: "grade",    dataType: "float"   }),
      col({ name: "feedback", dataType: "text"    }),
      tsCol("graded_at"),
    ], { x: 240, y: 600 }, "#ec4899"),
  ];

  return {
    nodes,
    edges: [
      { id: uuidv4(), source: ids.teachers,    target: ids.courses,     type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.students,    target: ids.enrollments, type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.courses,     target: ids.enrollments, type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.enrollments, target: ids.grades,      type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
    ],
  };
}

// ── Chat Application template ────────────────────────────────────────────────

function getChatDiagram(): DiagramData {
  const ids = {
    users: uuidv4(), workspaces: uuidv4(), channels: uuidv4(),
    messages: uuidv4(), members: uuidv4(),
  };

  const nodes: TableNode[] = [
    makeNode(ids.users, "users", [
      pkCol(),
      col({ name: "username",   dataType: "varchar", isUnique: true, isNullable: false }),
      col({ name: "email",      dataType: "varchar", isUnique: true, isNullable: false }),
      col({ name: "avatar_url", dataType: "text"    }),
      col({ name: "status",     dataType: "varchar" }),
      tsCol("last_seen_at"),
    ], { x: 50,  y: 200 }, "#6270f1"),

    makeNode(ids.workspaces, "workspaces", [
      pkCol(),
      col({ name: "name",     dataType: "varchar", isNullable: false }),
      col({ name: "slug",     dataType: "varchar", isUnique: true  }),
      fkCol("owner_id", "users"),
      tsCol("created_at"),
    ], { x: 380, y: 50  }, "#10b981"),

    makeNode(ids.members, "workspace_members", [
      pkCol(),
      fkCol("workspace_id", "workspaces"),
      fkCol("user_id",      "users"),
      col({ name: "role", dataType: "varchar" }),
      tsCol("joined_at"),
    ], { x: 380, y: 340 }, "#f59e0b"),

    makeNode(ids.channels, "channels", [
      pkCol(),
      fkCol("workspace_id", "workspaces"),
      col({ name: "name",       dataType: "varchar", isNullable: false }),
      col({ name: "is_private", dataType: "boolean" }),
      tsCol("created_at"),
    ], { x: 720, y: 50  }, "#3b82f6"),

    makeNode(ids.messages, "messages", [
      pkCol(),
      fkCol("channel_id", "channels"),
      fkCol("sender_id",  "users"),
      col({ name: "content",    dataType: "text",    isNullable: false }),
      col({ name: "is_edited",  dataType: "boolean" }),
      tsCol("created_at"),
    ], { x: 720, y: 340 }, "#ec4899"),
  ];

  return {
    nodes,
    edges: [
      { id: uuidv4(), source: ids.users,      target: ids.workspaces, type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.workspaces, target: ids.members,    type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.users,      target: ids.members,    type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.workspaces, target: ids.channels,   type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.channels,   target: ids.messages,   type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
      { id: uuidv4(), source: ids.users,      target: ids.messages,   type: "relationshipEdge", data: { relationshipType: "one-to-many" } },
    ],
  };
}

// ── Exported templates ────────────────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Users, products, categories, orders, and order items",
    icon: "🛒",
    tableCount: 6,
    tags: ["commerce", "shop", "retail"],
    getDiagram: getEcommerceDiagram,
  },
  {
    id: "blog",
    name: "Blog CMS",
    description: "Authors, posts, tags, comments with many-to-many tags",
    icon: "📝",
    tableCount: 5,
    tags: ["cms", "content", "blog"],
    getDiagram: getBlogDiagram,
  },
  {
    id: "school",
    name: "School Management",
    description: "Students, teachers, courses, enrollments, and grades",
    icon: "🎓",
    tableCount: 5,
    tags: ["education", "lms"],
    getDiagram: getSchoolDiagram,
  },
  {
    id: "chat",
    name: "Chat Application",
    description: "Users, workspaces, channels, members, and messages",
    icon: "💬",
    tableCount: 5,
    tags: ["messaging", "realtime", "slack-like"],
    getDiagram: getChatDiagram,
  },
];