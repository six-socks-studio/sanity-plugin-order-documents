# sanity-plugin-order-documents

Order your Sanity documents via drag-and-drop.

![sanity-plugin-order-documents example](./example.gif)

## Installation

To install the plugin, navigate to the root directory of your Sanity Studio project and run:

```sh
sanity install order-documents
```

Then, open `sanity.json` and append "order-documents" to the `"plugins"` array:

```json
"plugins": [
  "order-documents"
],
```

Now, when you run `sanity start`, you should see the "Order Documents" tab in the top navigation bar.

## Usage

To save a custom order, you'll need to add a hidden `order` field inside the schema file of any document type you want to order.

For example, to add `order` to the "movie" type, go into `./schemas/movie.js` and add:

```js
fields: [
  // other fields,
  {
    name: "order",
    title: "Order",
    type: "number",
    hidden: true,
  },
],
```

Now, when we query our dataset, we can order the results according to the `order` property.

### Querying with GROQ

To query movies using Sanity's query language GROQ, we can write:

```groq
*[_type == "movie"] | order(order asc)
```

Our custom order has been saved, and it will be reflected in the result!

There are a lot more GROQ examples in [Sanity's GROQ query cheat sheet](https://www.sanity.io/docs/query-cheat-sheet).

### Querying with GraphQL

Alternatively, using Sanity's GraphQL API, we can write:

```graphql
query {
  allMovie(sort: [{ order: ASC }]) {
    _id
    title
    order
    # more fields
  }
}
```

For more information, see [Sanity's GraphQL documentation](https://www.sanity.io/docs/graphql).


## Custom Fields

Want to save multiple orders for the same document type?

To allow custom fields, a type must include:

- the `order` field,
- one or more additional fields (which must be hidden and have type `"number"`).

For example, let's add two new custom fields to `./schemas/movie.js`:

```js
fields: [
  // other fields,
  {
    name: "order",
    title: "Order (default)",
    type: "number",
    hidden: true,
  },
    {
    name: "audiencePick",
    title: "Audience Pick",
    type: "number",
    hidden: true,
  },
    {
    name: "criticsPick",
    title: "Critics' Pick",
    type: "number",
    hidden: true,
  },
],
```

Now, when we select the "movie" type in our plugin, we'll see a new dropdown in the top right corner. We can now choose between three fields: the default order field and our two custom fields.

## Contributing

I'd welcome any contributions, from fixing a typo to something more substantial. You can raise a PR in [the project's GitHub repository](https://github.com/BretCameron/sanity-plugin-order-documents).

## Development

To develop this plugin, clone it into a local directory. Then, navigate to the root of the cloned repository and run:

```sh
yarn
yarn link
yarn start
```

Next, navigate to a Sanity Studio project and run:

```sh
yarn link "sanity-plugin-order-documents"
```

Open `sanity.json` in the Sanity Studio project and append "order-documents" to the `"plugins"` array:

```json
"plugins": [
  "order-documents"
],
```

We're already watching our plugin for changes, so all that's left is to run our Sanity Studio with `sanity start`.
