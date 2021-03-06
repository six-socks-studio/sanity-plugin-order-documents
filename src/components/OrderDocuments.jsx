import React from "react";
import update from "immutability-helper";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import client from "part:@sanity/base/client";
import { withRouterHOC } from "part:@sanity/base/router";
import styles from "../index.css";
import { setOrder, setListOrder, getDocumentTypeNames, willUserOverrideData } from "../functions";
import { DEFAULT_FIELD_VALUE, DEFAULT_FIELD_LABEL } from "../data";
import DraggableSection from "./organisms/DraggableSection";
import TypeSection from "./organisms/TypeSection";

const PAGE_SIZE = 25;
// note: going above 25 can lead to Promises not resolving

class OrderDocuments extends React.Component {
  state = {
    count: 0,
    documents: [],
    types: [],
    type: { label: "", value: "" },
    field: { label: DEFAULT_FIELD_LABEL, value: DEFAULT_FIELD_VALUE },
    fields: []
  };

  componentDidMount() {
    this.getTypes();
  }

  loadMore = async () => {
    const length = this.state.documents.length;

    const newDocuments = await client.fetch(
      `*[!(_id in path("drafts.**")) && _type == $types] | order (${
        this.state.field.value
      } asc, order asc, _updatedAt desc)[${length}...${length + PAGE_SIZE}]`,
      { types: this.state.type.value }
    );

    const documents = [...this.state.documents, ...newDocuments];

    this.setState({ documents });

    await setListOrder(newDocuments, this.state.field.value, length);
  };

  getTypes = () => {
    const types = getDocumentTypeNames();
    this.setState({ types });
  };

  getFields = () => {
    const { type, types } = this.state;

    const selectedType = types.find(({ name }) => name === type.value);

    const fields = (selectedType ? selectedType.fields : []).map(({ name, title }) => ({
      value: name,
      label: title
    }));

    this.setState({ fields });
  };

  refreshTypes = () => {
    this.getTypes();
    this.getFields();
  };

  refreshDocuments = async () => {
    const count = await client.fetch(`count(*[!(_id in path("drafts.**")) && _type == $types])`, {
      types: this.state.type.value
    });

    const documents = await client.fetch(
      `*[!(_id in path("drafts.**")) && _type == $types] | order (${this.state.field.value} asc, order asc, _updatedAt desc)[0...${PAGE_SIZE}]`,
      { types: this.state.type.value }
    );

    this.setState({ documents, count });

    if (documents.length > 0) {
      await setListOrder(documents, this.state.field.value);
    }
  };

  isSafeToProceed = (documents, field, type) => {
    const shouldShowWarning = willUserOverrideData(documents, field.value);

    let shouldProceed = true;

    if (shouldShowWarning) {
      shouldProceed = window.confirm(
        `It looks like you are already storing data for:
 • Type: ${type.label}
 • Field: ${field.label}

Override existing data? This is a one-time operation and cannot be reversed.`
      );
    }

    return shouldProceed;
  };

  handleTypeChange = async ({ value, label }) => {
    const count = await client.fetch(`count(*[!(_id in path("drafts.**")) && _type == $types])`, {
      types: value
    });

    const documents = await client.fetch(
      `*[!(_id in path("drafts.**")) && _type == $types] | order (${this.state.field.value} asc, order asc, _updatedAt desc)[0...${PAGE_SIZE}]`,
      { types: value }
    );

    const shouldProceed = this.isSafeToProceed(documents, this.state.field, { value, label });

    if (shouldProceed) {
      this.setState({ type: { value, label }, documents, count }, () => {
        this.getFields();
      });

      if (documents.length > 0) {
        await setListOrder(documents, this.state.field.value);
      }
    }
  };

  handleFieldChange = async ({ value, label }) => {
    const count = await client.fetch(`count(*[!(_id in path("drafts.**")) && _type == $types])`, {
      types: this.state.type.value
    });

    const documents = await client.fetch(
      `*[!(_id in path("drafts.**")) && _type == $types] | order (${value} asc, order asc, _updatedAt desc)[0...${PAGE_SIZE}]`,
      { types: this.state.type.value }
    );

    const shouldProceed = this.isSafeToProceed(documents, { value, label }, this.state.type);

    if (shouldProceed) {
      this.setState({ field: { value, label }, documents, count });

      if (documents.length > 0) {
        await setListOrder(this.state.documents, value);
      }
    }
  };

  moveCard = async (beforeIndex, afterIndex) => {
    const card1 = this.state.documents[beforeIndex];
    const card2 = this.state.documents[afterIndex];

    this.setState({
      documents: update(this.state.documents, {
        $splice: [
          [beforeIndex, 1],
          [afterIndex, 0, card1]
        ]
      })
    });

    await Promise.all([
      setOrder(card1._id, afterIndex, this.state.field.value),
      setOrder(card2._id, beforeIndex, this.state.field.value)
    ]);
  };

  render() {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className={styles.container}>
          <div className={styles.outerWrapper}>
            <div className={styles.innerWrapper}>
              <TypeSection
                {...this.state}
                handleTypeChange={this.handleTypeChange}
                handleFieldChange={this.handleFieldChange}
                refreshTypes={this.refreshTypes}
              />
              <DraggableSection
                documents={this.state.documents}
                count={this.state.count}
                type={this.state.type}
                moveCard={this.moveCard}
                refreshDocuments={this.refreshDocuments}
                loadMore={this.loadMore}
              />
            </div>
          </div>
        </div>
      </DndProvider>
    );
  }
}

export default withRouterHOC(OrderDocuments);
