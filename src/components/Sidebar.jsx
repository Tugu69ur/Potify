import { Collapse, Checkbox, Divider } from "antd";

const categories = [
  "T-Shirts",
  "Hoodies",
  "Sweatshirts",
  "Pants",
  "Jeans",
  "Hats",
];

const masterCategories = ["Tops", "Bottoms", "Headwear"];

const genders = ["Men", "Women", "Unisex"];

export default function Sidebar({
  filters = {
    subCategories: [],
    masterCategories: [],
    genders: [],
  },
  onFiltersChange = () => {},
}) {
  const items = [
    {
      key: "1",
      label: (
        <span
          style={{
            fontWeight: 600,
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Product Type
        </span>
      ),
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {categories.map((category) => (
            <Checkbox
              key={category}
              checked={filters.subCategories.includes(category)}
              onChange={(e) => {
                onFiltersChange({
                  ...filters,
                  subCategories: e.target.checked
                    ? [...filters.subCategories, category]
                    : filters.subCategories.filter((c) => c !== category),
                });
              }}
              style={{ fontSize: "13px" }}
            >
              {category}
            </Checkbox>
          ))}
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span
          style={{
            fontWeight: 600,
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Category
        </span>
      ),
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {masterCategories.map((category) => (
            <Checkbox
              key={category}
              checked={filters.masterCategories.includes(category)}
              onChange={(e) => {
                onFiltersChange({
                  ...filters,
                  masterCategories: e.target.checked
                    ? [...filters.masterCategories, category]
                    : filters.masterCategories.filter((c) => c !== category),
                });
              }}
              style={{ fontSize: "13px" }}
            >
              {category}
            </Checkbox>
          ))}
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <span
          style={{
            fontWeight: 600,
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Gender
        </span>
      ),
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {genders.map((gender) => (
            <Checkbox
              key={gender}
              checked={filters.genders.includes(gender)}
              onChange={(e) => {
                onFiltersChange({
                  ...filters,
                  genders: e.target.checked
                    ? [...filters.genders, gender]
                    : filters.genders.filter((g) => g !== gender),
                });
              }}
              style={{ fontSize: "13px" }}
            >
              {gender}
            </Checkbox>
          ))}
        </div>
      ),
    },
  ];

  return (
    <aside
      className="sidebar-panel"
      style={{
        padding: "20px",
        backgroundColor: "#fafafa",
        borderRadius: "4px",
        border: "1px solid #f0f0f0",
      }}
    >
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: "0 0 20px",
          color: "#000",
        }}
      >
        Filters
      </h2>

      <Collapse
        items={items}
        defaultActiveKey={["1", "2", "3"]}
        style={{
          backgroundColor: "transparent",
          border: "none",
        }}
      />
    </aside>
  );
}
