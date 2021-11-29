import { Parser, FieldInfo, FieldValueCallbackWithoutField } from "json2csv";
import { capitalCase } from "change-case";
import { DocumentManufacturerReport } from "./DocumentReportGenerator";
import { roundNumber } from "../../../common/src/lib/mathutils";

type CSVFields<T> = Array<string | FieldInfo<T>> | undefined;

export class ReportCSVFormatter {

    static DEFAULT_FIELDS: CSVFields<DocumentManufacturerReport> = [
      {
        label: 'Document ID',
        value: 'info.id',
      },
      {
        label: 'Document Name',
        value: 'info.title',
      },
      {
        label: 'URL',
        value: 'info.url',
      },
      {
        label: 'Organization Name',
        value: 'info.orgName',
      },
      {
        label: 'Created On',
        value: 'info.createdOn',
      },
      {
        label: 'Last Modified On',
        value: 'info.lastModifiedOn',
      },
      {
        label: 'Last Modified By',
        value: 'info.lastModifiedBy',
      },
      {
        label: 'Locale',
        value: 'info.locale',
      },
      {
        label: 'Calculation',
        value: 'info.hasCalculation',
      },
      {
        label: 'Included',
        value: 'info.includedInReport',
      },
      {
        label: 'Levels',
        value: 'stats.levels',
      },
    ];

    static formatDocumentReport(report: DocumentManufacturerReport): string {
      const fields = [ ... ReportCSVFormatter.DEFAULT_FIELDS];
      const fieldsKeySet = {};
      // tslint:disable-next-line: forin
      for (const manufacturer in report.data) {
        fields.push( ... ReportCSVFormatter.convertDocumentReportToFields(report, fieldsKeySet, manufacturer) );
      }
      const json2csv = new Parser( {fields});
      return json2csv.parse([report]);
    }

    static formatManufacturerReport(manufacturer: string, report: DocumentManufacturerReport[]): string {
        const fields = [ ... ReportCSVFormatter.DEFAULT_FIELDS];
        const fieldsKeySet = {};
        for (const row of report) {
          fields.push( ... ReportCSVFormatter.convertDocumentReportToFields(row, fieldsKeySet, manufacturer) );
        }
        const json2csv = new Parser( {fields});
        return json2csv.parse(report);
    }

  private static convertDocumentReportToFields(
      row: DocumentManufacturerReport,
      fieldsKeySet: {},
      manufacturer: string) {

        const fields: CSVFields<DocumentManufacturerReport> = [];

        // tslint:disable:forin
        const components = row.data[manufacturer];
        for (const component in components) {
          const materials = components[component];
          for (const material in materials) {
            for (const size in materials[material]) {
              const entry = materials[material][size];
              const baseKey = `data.${manufacturer}.${component}.${material}.${size}`;
              const hasLength = entry.length && entry.length > 0;
              const keyName = hasLength ? `${baseKey}.length` : `${baseKey}.count`;

              const suffix = hasLength ? "(m)" : ( component.toLowerCase() === "pipe" ? "(seg)" : "(ct)" );
              const newField: FieldInfo<DocumentManufacturerReport> = {
                value: keyName,
                label: ReportCSVFormatter.formatLabelName(manufacturer, component, material, size, suffix),
              };
              // for length measurements with decimal, we need to declare a formatter to round cell values down
              // the formatter gets form teh closure the values of manufacturer, component, material and size
              // and uses those for each cell to retrieve the value, if it exists
              if (hasLength) {
                const formatter: FieldValueCallbackWithoutField<DocumentManufacturerReport> =
                  (r: DocumentManufacturerReport) => {
                    const value = r.data[manufacturer] ?
                      r.data[manufacturer][component] ?
                      r.data[manufacturer][component][material] ?
                      r.data[manufacturer][component][material][size] ?
                      r.data[manufacturer][component][material][size].length : null : null : null : null;
                    if (value) {
                      return roundNumber(value, 2);
                    } else {
                      return null;
                    }
                  };
                newField.value = formatter;
              }
              if (!(keyName in fieldsKeySet)) {
                fieldsKeySet[keyName] = keyName;
                fields.push(newField);
              }
            }
          }
        }

        return fields;
  }

  private static formatLabelName(
    manufacturer: string, component: string, material: string, size: string, suffix: string): string {
    let label = `${trimAll(capitalCase(manufacturer))}\r\n`;
    if (component.toLowerCase() !== "pipe") {
      label += `${trimAll(capitalCase(component))} `;
    }
    if (material !== "null") {
      label += `${trimAll(capitalCase(material))} `;
    }
    if (size !== "null") {
      label += `${capitalCase(size)} mm `;
    }
    label += `${suffix}`;
    return label;
  }
}

function trimAll(s: string) {
  return s.replace(/\s/g, '');
}
