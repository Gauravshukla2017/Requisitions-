import { useEffect, useState } from "react";
import styles from "./styles/App.module.css";
import Screen from "./components/screen";
import Snackbar from "./components/snackbar";
import List from "./components/list";
import useRequest from "./components/request";

function getDate() {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  const year = date.getFullYear();

  day = day < 10 ? `0${day}` : day;
  month = month < 10 ? `0${month}` : month;

  return `${day}-${month}-${year}`;
}

function prefix(value) {
  return value < 10 ? `0${value}` : value;
}

function computeTimeBracket() {
  const date = new Date();
  const hour = date.getHours();
  let minute = date.getMinutes();
  minute = minute - (minute % 15);
  const timeBracket1 = prefix(hour) + ":" + prefix(minute);
  const tb2Date = new Date();
  tb2Date.setHours(hour);
  tb2Date.setMinutes(minute + 15);
  const timeBracket2 =
    prefix(tb2Date.getHours()) + ":" + prefix(tb2Date.getMinutes());
  return `${timeBracket1}-${timeBracket2}`;
}

function App() {
  const [
    { data: revision, loading: loadingRevision, error: revisionError },
    makeRevisionRequest,
  ] = useRequest(
    "https://wbes.wrldc.in/Report/GetCurrentDayFullScheduleMaxRev?regionid=2&ScheduleDate=:date"
  );
  const [{ data, loading, error }, makeRequisitionRequest] = useRequest(
    "https://wbes.wrldc.in/Report/GetRldcData?isBuyer=false&utilId=ALL&regionId=2&scheduleDate=:date&revisionNumber=:revisionNumber&byOnBar=0"
  );
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const refreshTime = 15; // in mins
  const [activeBlock, setActiveBlock] = useState(2);
  const timeBracket = computeTimeBracket();

  const date = getDate();

  useEffect(() => {
    makeRevisionRequest({
      date,
    });
    const interval = setInterval(() => {
      setLoadingMessage("Refreshing...");
      makeRevisionRequest({
        date,
      });
    }, refreshTime * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (revision?.MaxRevision) {
      makeRequisitionRequest({
        revisionNumber: revision.MaxRevision,
        date,
      });
    }
  }, [revision]);

  useEffect(() => {
    setActiveBlock((oldBlock) => {
      if (data?.jaggedarray) {
        setActiveBlock(
          data.jaggedarray.findIndex((block) => block[1] === timeBracket)
        );
      }
      return oldBlock;
    });
  }, [data]);

  return (
    <Screen
      loading={loadingRevision || loading}
      loadingMessage={loadingMessage}
      loadingClass={styles.loader}
      className={styles.main}
      error={error || revisionError}
    >
      <div className={styles.header}>
        <img
          src="Tata_Power_logo.svg"
          alt="Tata Power Logo"
          className={styles.img}
        />
        <h3>Mundra Thermal Power Station</h3>
      </div>
      <List
        items={
          (Boolean(data?.jaggedarray) && [data?.jaggedarray[activeBlock]]) || []
        }
        className={styles.items}
        renderItem={({ item, index }) => {
          return (
            <table
              key={index}
              className={styles.item}
              border="1"
              cellSpacing={0}
            >
              <tbody>
                <tr className={styles.tableHeader}>
                  <td>Block</td>
                  <td colSpan={2}>{item[0]}</td>
                  <td colSpan={3}>Time slot</td>
                  <td colSpan={2}>{item[1]}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Gujarat</td>
                  <td>Haryana</td>
                  <td>Maharashtra</td>
                  <td>Punjab</td>
                  <td>Rajasthan</td>
                  <td colSpan={3}>Total</td>
                </tr>
                <tr>
                  <td>MW</td>
                  <td>{item[2]}</td>
                  <td>{item[3]}</td>
                  <td>{item[4]}</td>
                  <td>{item[5]}</td>
                  <td>{item[6]}</td>
                  <td>
                    {item
                      .splice(2, 5)
                      .reduce(
                        (prev, next) => parseFloat(prev) + parseFloat(next),
                        0
                      )}
                  </td>
                </tr>
              </tbody>
            </table>
          );
        }}
      />
    </Screen>
  );
}

export default App;
