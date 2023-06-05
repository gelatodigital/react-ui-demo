import "./App.css";
import NavBar from "./components/NavBar";
import useTitle from "./hooks/useTitle";
import { useEffect, useState } from "react";
import { Signer, ethers } from "ethers";

import { lensGelatoAddress, lensGelatoAbi } from "./assets/abi/LensGelato_abi";
import { LensGelatoGPT } from "./blockchain/contracts/LensGelatoGPT";
import { lensHubAbi, lensHubAddress } from "./assets/abi/LensHub_abi";
import { ILensHub } from "./blockchain/contracts/ILensHub";
import PlaceHolderApp from "./components/PlaceHolder";

const largeProps = {
  force: 0.6,
  duration: 5000,
  particleCount: 200,
  height: 1600,
  width: 1600,
};

const DEDICATED_MSG_SENDER ="0xbb97656cd5fece3a643335d03c8919d5e7dcd225"
const TRACKING_ID = "G-BHGWJ5K58J";


export enum UI_STATUS {
  NOT_CONNECTED,
  PROFILE_NOT_AVAILABLE,
  DISPATCHER_NOT_SET,
  DISPATCHER_SET,
  PROMPT_AVAILABLE,
  PROPMT_NOT_AVAILABLE,
}

function App() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [profileId, setProfileId] = useState("");
  const [promptAvailable, setPromptAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uiStatus, setUiStatus] = useState(UI_STATUS.NOT_CONNECTED);
  const [signer, setSigner] = useState<any>(null);
  const [promptSentence, setPromptSentence] = useState<string>("");
  const [lensGelato, setLensGelato] = useState<LensGelatoGPT | null>(null);
  const [lensHub, setLensHub] = useState<ILensHub | null>(null);
  const [isExploding, setExploding] = useState(false);
  
  let network: "mumbai" | "localhost" | "polygon" = "polygon"; //"mumbai"; // 'mumbai';// "localhost"; //
  
  const initializeContract = async (signer: Signer) => {
    setUiStatus(UI_STATUS.PROFILE_NOT_AVAILABLE)
    let lensGelato = new ethers.Contract(
      lensGelatoAddress,
      lensGelatoAbi,
      signer
    ) as LensGelatoGPT;

  

    setLensGelato(lensGelato);

    let lensHub = new ethers.Contract(
      lensHubAddress,
      lensHubAbi,
      signer
    ) as ILensHub;

    setLensHub(lensHub);

    setConnected(true);
    console.log(connected);
    setAddress(await signer.getAddress());
    console.log(address);


    checkProfile(signer,lensHub,lensGelato)
  };


  const checkProfile = async(signer:Signer, lensHub:ILensHub, lensGelato:LensGelatoGPT) => {
    let signerAddress = await signer.getAddress();

    const nrTokens = +(await lensHub.balanceOf(signerAddress)).toString() ?? 0;
    if (nrTokens == 0) {
      setUiStatus(UI_STATUS.PROFILE_NOT_AVAILABLE)
      setIsLoading(false)
    } else {
      const profileId = await lensHub?.tokenOfOwnerByIndex(signerAddress,0);
      if (profileId != undefined){
        setProfileId(profileId.toString())

        const dispatcher = await lensHub.getDispatcher(profileId)

        if (dispatcher.toLowerCase() == DEDICATED_MSG_SENDER.toLowerCase()) {
        
    
           const propmt = await lensGelato?.promptByProfileId(+profileId.toString())
        

           if (propmt == undefined || propmt.length <10) {
            
            setUiStatus(UI_STATUS.PROPMT_NOT_AVAILABLE)
            setIsLoading(false)
           } else {
            setUiStatus(UI_STATUS.PROMPT_AVAILABLE)
            setPromptSentence(propmt)
            setPromptAvailable(true)
            setIsLoading(false)
        
           }


        } else {
          console.log('dispatcher_not_set');
          setUiStatus(UI_STATUS.DISPATCHER_NOT_SET)
          setIsLoading(false)
        }


      
      } else {
        setUiStatus(UI_STATUS.PROFILE_NOT_AVAILABLE)
      }
    } 
  }


  const setAction= async (action:number) => {

  };





  const connectButton = async () => {
    ////local
    setIsLoading(true)

    try {
    
    if (network == "localhost") {
      const provider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545/"
      );
      const accounts = await provider.listAccounts();

      const { chainId } = await provider.getNetwork();
      const signer = await provider.getSigner();

      initializeContract(signer);
    } else {
      //// wallet

      let ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert("Please install Metamask");
      } else if (ethereum.isMetaMask) {
        const provider = new ethers.providers.Web3Provider(ethereum as any);
        const currentChainId = await ethereum.request({
          method: "eth_chainId",
        });

      

        if (currentChainId !== "0x89"){ 
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: "0x89"}],
          });
        }

        //    if (currentChainId !== "0x13881"){ 
        //   await ethereum.request({
        //     method: 'wallet_switchEthereumChain',
        //     params: [{ chainId: "0x13881"}],
        //   });
        // }

       


       // const params =paramsDeployment[parseInt(currentChainId)] 


        const accounts = await provider.send("eth_requestAccounts", []);
        const { chainId } = await provider.getNetwork();
        let signer = await provider.getSigner();
        setSigner(signer);

        initializeContract(signer);
      }
    }
   
  } catch (error) {
    setIsLoading(false)
  }

  };

  useTitle("LensGPT Lens account powered with ChatGPT and Gelato Web3 Function");



  return (
    <div className="App bg-slate-600 h-screen flex flex-col content-center">
  
      <NavBar
        connected={connected}
        address={address}
        connectButton={connectButton}
      />
      <PlaceHolderApp
        connected={connected}
        uiStatus={uiStatus}
        setAction={setAction}
        isLoading={isLoading}
      />

    </div>
  );
}

export default App;
