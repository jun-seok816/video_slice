import React, { useState, useEffect, useRef } from "react";
import { Outlet, Route, Routes } from "react-router";
import C_Main from "./component/editor/Main";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function Root(){
    return(
        <Routes>
            <Route index element={<C_Main/>}></Route>
        </Routes>
    )
}

const container = document.getElementById("app");
const root = createRoot(container!); // createRoot(container!) if you use TypeScript

root.render(
  <>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </>
);