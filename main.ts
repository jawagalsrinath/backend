import shirtJson from "./shirtJsonfile.json";

type FieldType = {
  name: string;
  fieldName: string;
};

class Parser {
  json: any = {};
  parsedObject: any = {};

  private parseName(name: string): string {
    return name.split("_").map((x) => x[0].toUpperCase() + x.slice(1)).join(
      " ",
    );
  }

  private getValueByPath(path: string): any | undefined {
    const keys = path.split(".");
    let value = this.json;
    for (const key of keys) {
      if (value.hasOwnProperty(key)) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  }

  extractFields(fieldName: FieldType[], path?: string) {
    this.getFields(fieldName, this.parsedObject, path);
    return this;
  }

  setJson(json: any) {
    this.json = json;
    return this;
  }

  getFields(fields: FieldType[], retJson: any = {}, path?: string) {
    let obj = this.json;
    if (path) {
      obj = this.getValueByPath(path);
    }
    for (let field of fields) {
      try {
        let val = obj[field.fieldName];
        if (val !== undefined) {
          retJson[field.name] = val;
        }
      } catch (err) {
      }
    }
    return retJson;
  }

  getEnumValue(data: any): JSON {
    const enums: any = {};
  
    function loop(obj: any, path: string[] = []) {
      for (const key in obj) {
        const value = obj[key];
        const currentPath = path.concat(key);
  
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            // Recursively loop through arrays
            value.forEach(item => loop(item, currentPath));
          } else {
            // Check if value has "enum" or "enumNames" property
            if (value.enum && value.enumNames && value.enum.length === value.enumNames.length) {
              // Combine enum values and names if both exist and match in length
              value.enumNames.forEach((name: string, index: number) => {
                enums[name] = value.enum[index];
              });
            } else {
              // Recursively loop through nested objects
              loop(value, currentPath);
            }
          }
        }
      }
    }
  
    loop(data);
  
    // Return formatted JSON string
    return enums;
  }

  enumValues() {
    let data = this.json;
    this.parsedObject["Values"] = this.getEnumValue(data);
    return this;
  }

  addErrorMessage(fieldName: string) {
    this.parsedObject["ErrorMessage"] = `${this.parseName(fieldName)
      } is Required`;
    return this;
  }

  addValidation() {
    const validationFields: FieldType[] = [
      {
        name: "MinUniqueItems",
        fieldName: "minUniqueItems",
      },
      {
        name: "MaxUniqueItems",
        fieldName: "maxUniqueItems",
      },
      {
        name: "Type",
        fieldName: "type",
      },
      {
        name: "MinItems",
        fieldName: "minItems",
      },
    ];

    this.parsedObject["Validation"] = this.getFields(validationFields);
    return this;
  }

  parse() {
    return this.parsedObject;
  }
}


const fieldsToGet: FieldType[] = [
  {
    name: "FrontEndLabel",
    fieldName: "title",
  },
  {
    name: "Editable",
    fieldName: "editable",
  },
  {
    name: "Hidden",
    fieldName: "hidden",
  },
];

const getProperties = (json: any) => {
  const objectProperties = json["properties"];
  const p = new Parser();
  for (let x of Object.keys(objectProperties)) {
    console.log(
      p
        .setJson(objectProperties[x])
        .extractFields([{
          name: "FrontEndLabel",
          fieldName: "title",
        }])
        .extractFields(fieldsToGet, "items.properties.value")
        .addValidation()
        .addErrorMessage(x)
        .parse(),

    );
  }
};

getProperties(shirtJson);
