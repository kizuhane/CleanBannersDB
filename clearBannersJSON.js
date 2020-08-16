// node clearBannersJSON.js banners.json bannersMobile.json article-banners.json

const { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } = require("fs");

// GLOBALS
const reserveBannersName = "fallback";

const dbEntriesBody = ["campaignName", "ImageURL", "href", "startData", "endData"];

const dbJsonNames = {
  articles: "article-banners.json",
  desktop: "banners.json",
  mobile: "bannersMobile.json",
};

const flags = {
  clearEmptyAdvFields: false,
  all: false,
};

const reportObject = {};

// APP
const getArgs = () => {
  const args = [];

  const argv = process.argv.slice(2, process.argv.length);

  if (!argv.length)
    return console.error(
      "nie wskazano plików, wskarz pliki albo przefiltruj wszystkie kożystając z argumentu --all"
    );

  argv.forEach((el) => {
    if (el.startsWith("-")) {
      if (el === "--all") flags.all = true;
      if (el === "--clean") flags.clearEmptyAdvFields = true;
    } else {
      args.push(el);
    }
  });

  return flags.all ? Object.values(dbJsonNames) : args;
};

const getFiles = (filesName) => {
  try {
    reportObject[filesName] = { startSize: statSync(filesName).size };
    const data = JSON.parse(readFileSync(filesName, "utf-8"));
    return data.banners;
  } catch (err) {
    console.log(err);
  }
};

const cleanReserve = ({ fieldsName, data }) => {
  const reserveFields = { ...data };

  fieldsName.forEach((el) => {
    if (reserveFields[el]) delete reserveFields[el];
  });

  return reserveFields;
};

const saveCleanedFile = ({ name, data }) => {
  //
  if (!existsSync("./output")) {
    mkdirSync("./output");
  }

  writeFileSync(`./output/${name}-cleaned`, JSON.stringify(data));
  reportObject[name].endSize = statSync(`./output/${name}-cleaned`).size;
  console.log(`${name} saved!!`);
};

const displayReport = () => {
  console.log("------------------------------------------------------------------");
  console.log(reportObject);
};

filterFileData = (filesNames) => {
  const dateThreshold = new Date(new Date() - 2628000000);

  filesNames.forEach((el) => {
    const dbData = getFiles(el);
    const dbDataElements = Object.keys(dbData);
    const filterData = { banners: {} };
    const emptyFields = [];

    try {
      dbDataElements.forEach((el) => {
        const filterCampaignContent = [];

        //  ignore reserve banners
        if (el !== reserveBannersName) {
          // filter true item in adv field
          dbData[el].map((item) => {
            if (new Date(new Date(item[dbEntriesBody[4]]).valueOf()) > dateThreshold) {
              filterCampaignContent.push(item);
            }
          });

          if (!filterCampaignContent.length) emptyFields.push(el);

          // don't add empty adv fields if flag clean is active
          if (flags.clearEmptyAdvFields) {
            if (filterCampaignContent.length)
              filterData.banners[el] = filterCampaignContent;
          } else {
            filterData.banners[el] = filterCampaignContent;
          }
        }
      });
    } catch (err) {
      console.log(err);
    }

    reportObject[el].emptyFields = emptyFields;

    if (flags.clearEmptyAdvFields) {
      const cleanedReserve = cleanReserve({
        fieldsName: emptyFields,
        data: dbData[reserveBannersName],
      });

      reportObject[el].emptyFieldsRemoved = true;
      filterData.banners[reserveBannersName] = cleanedReserve;
    } else {
      filterData.banners[reserveBannersName] = dbData[reserveBannersName];
    }
    // save cleaned file
    saveCleanedFile({ name: el, data: filterData });
  });
};

const filesNames = getArgs();

filterFileData(filesNames);
displayReport();
