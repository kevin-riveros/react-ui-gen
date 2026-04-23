---
name: heroui-components
description: HeroUI v3 anatomy cheat sheet — exact dot-notation trees for the 22 most-used components, sourced from the HeroUI MCP. Use as the source of truth for sub-component names.
---

# HeroUI v3 anatomy

Sourced from `@heroui/react-mcp`. Import everything from `@heroui/react`.

**No `HeroUIProvider`.** Just `import "./index.css"` once in `/App.jsx`.

**React Aria semantics:** `onPress` (not `onClick`), `isDisabled` (not `disabled`), `isInvalid`, `isSelected`, `isLoading`.

**Button variants:** `primary | secondary | tertiary | outline | ghost | danger | danger-soft`. No `color` prop.

**Semantic `color` (Chip, Avatar, ProgressBar) / `status` (Alert):** `default | accent | success | warning | danger`.

**Sizes:** `sm | md | lg`.

---

### Button

```tsx
<Button />
```

### Input

```tsx
<Input />
```

### TextArea

```tsx
<TextArea />
```

### Select

```tsx
<Select>
  <Label />
  <Select.Trigger>
    <Select.Value />
    <Select.Indicator />
  </Select.Trigger>
  <Description />
  <Select.Popover>
    <ListBox>
      <ListBox.Item>
        <Label />
        <Description />
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Section>
        <Header />
        <ListBox.Item>
          <Label />
        </ListBox.Item>
      </ListBox.Section>
    </ListBox>
  </Select.Popover>
</Select>
```

### Checkbox

```tsx
<Checkbox>
  <Checkbox.Control>
    <Checkbox.Indicator />  
  </Checkbox.Control>
  <Checkbox.Content>
    <Label />
    <Description /> {/* Optional */}
  </Checkbox.Content>
</Checkbox>
```

### Switch

```tsx
<Switch>
  <Switch.Control>
    <Switch.Thumb>
      <Switch.Icon/> {/* Optional */}
    </Switch.Thumb>
  </Switch.Control>
  <Switch.Content>
    <Label />
    <Description /> {/* Optional */}
  </Switch.Content>
</Switch>
```

### RadioGroup

```tsx
<RadioGroup>
  <Label />
  <Description />
  <Radio value="option1">
    <Radio.Control>
      <Radio.Indicator>
        <span>✓</span> {/* Custom indicator (optional) */}
      </Radio.Indicator>
    </Radio.Control>
    <Radio.Content>
      <Label />
      <Description />
    </Radio.Content>
  </Radio>
  <FieldError />
</RadioGroup>
```

### Card

```tsx
<Card>
  <Card.Header>
    <Card.Title />
    <Card.Description />
  </Card.Header>
  <Card.Content />
  <Card.Footer />
</Card>
```

### Modal

```tsx
<Modal>
  <Button>Open Modal</Button>
  <Modal.Backdrop>
    <Modal.Container>
      <Modal.Dialog>
        <Modal.CloseTrigger /> {/* Optional: Close button */}
        <Modal.Header>
          <Modal.Icon /> {/* Optional: Icon */}
          <Modal.Heading />
        </Modal.Header>
        <Modal.Body />
        <Modal.Footer />
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>
```

### Alert

```tsx
<Alert>
  <Alert.Indicator />
  <Alert.Content>
    <Alert.Title />
    <Alert.Description />
  </Alert.Content>
</Alert>
```

### Tabs

```tsx
<Tabs>
  <Tabs.ListContainer>
    <Tabs.List aria-label="Options">
      <Tabs.Tab>
        <Tabs.Separator /> {/* Optional */}
        <Tabs.Indicator />
      </Tabs.Tab>
    </Tabs.List>
  </Tabs.ListContainer>
  <Tabs.Panel/>
</Tabs>
```

### Accordion

```tsx
<Accordion>
  <Accordion.Item>
    <Accordion.Heading>
      <Accordion.Trigger>
        <Accordion.Indicator />
      </Accordion.Trigger>
    </Accordion.Heading>
    <Accordion.Panel>
      <Accordion.Body/>
    </Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

### Avatar

```tsx
<Avatar>
  <Avatar.Image/>
  <Avatar.Fallback/>
</Avatar>
```

### Chip

```tsx
<Chip />
```

### Tooltip

```tsx
<Tooltip>
  <Tooltip.Trigger>
    <Button>Hover for tooltip</Button>
  </Tooltip.Trigger>
  <Tooltip.Content>
    <Tooltip.Arrow />
    Helpful information about this element
  </Tooltip.Content>
</Tooltip>
```

### Popover

```tsx
<Popover>
  <Popover.Trigger/>
  <Popover.Content>
    <Popover.Arrow />
    <Popover.Dialog>
      <Popover.Heading/>
      {/* content goes here */}
    </Popover.Dialog>
  </Popover.Content>
</Popover>
```

### Dropdown

```tsx
<Dropdown>
  <Dropdown.Trigger>
    <Button />
  </Dropdown.Trigger>
  <Dropdown.Popover>
    <Dropdown.Menu>
      <Dropdown.Item>
        <Label />
        <Description />
        <Kbd slot="keyboard" />
        <Dropdown.ItemIndicator />
      </Dropdown.Item>
      <Separator />
      <Dropdown.Section>
        <Header />
        <Dropdown.Item />
      </Dropdown.Section>
      <Dropdown.SubmenuTrigger>
        <Dropdown.Item>
          <Label />
          <Dropdown.SubmenuIndicator />
        </Dropdown.Item>
        <Dropdown.Popover>
          <Dropdown.Menu>
            <Dropdown.Item />
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.SubmenuTrigger>
    </Dropdown.Menu>
  </Dropdown.Popover>
</Dropdown>
```

### Spinner

```tsx
<Spinner />
```

### ProgressBar

```tsx
<ProgressBar value={60}>
  <Label>Loading</Label>
  <ProgressBar.Output />
  <ProgressBar.Track>
    <ProgressBar.Fill />
  </ProgressBar.Track>
</ProgressBar>
```

### Skeleton

```tsx
<Skeleton />
```

### Table

```tsx
<Table>
  <Table.ScrollContainer>
    <Table.Content aria-label="Example table">
      <Table.Header>
        <Table.Column>Name</Table.Column>
        <Table.Column>Role</Table.Column>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Kate Moore</Table.Cell>
          <Table.Cell>CEO</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Content>
  </Table.ScrollContainer>
  <Table.Footer>{/* Optional footer content */}</Table.Footer>
</Table>
```

### Pagination

```tsx
<Pagination>
  <Pagination.Summary>Showing 1-10 of 100 results</Pagination.Summary>
  <Pagination.Content>
    <Pagination.Item>
      <Pagination.Previous>
        <Pagination.PreviousIcon />
        <span>Previous</span>
      </Pagination.Previous>
    </Pagination.Item>
    <Pagination.Item>
      <Pagination.Link isActive>1</Pagination.Link>
    </Pagination.Item>
    <Pagination.Item>
      <Pagination.Ellipsis />
    </Pagination.Item>
    <Pagination.Item>
      <Pagination.Link>10</Pagination.Link>
    </Pagination.Item>
    <Pagination.Item>
      <Pagination.Next>
        <span>Next</span>
        <Pagination.NextIcon />
      </Pagination.Next>
    </Pagination.Item>
  </Pagination.Content>
</Pagination>
```

---

## Do NOT use (v2 / NextUI names that don't exist in v3)

`HeroUIProvider`, `Textarea` (use `TextArea`), `CardBody` (use `Card.Content`), `ToastProvider`, `Tabs.TabList` / `.TabPanel` (use `.List` / `.Panel`), `Accordion.Content` (use `.Panel`), `Select.Item` / `ComboBox.Item` (use `ListBox` + `ListBoxItem` inside `.Popover`), `Button color="primary"` (use `variant`).
