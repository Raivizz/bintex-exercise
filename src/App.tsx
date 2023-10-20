import React from "react";
import "./App.css";
import "@picocss/pico";
import ShowTableView from "./components/TableView";

function App() {
    return (
        <div className="App">
            <h1>COVID-19 Data</h1>
            <ShowTableView />
        </div>
    );
}

export default App;
