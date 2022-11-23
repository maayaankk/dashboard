import React from "react";
import logo from "assets/favicon.ico"

// Chakra imports
import { Flex, useColorModeValue, Text, Image } from "@chakra-ui/react";

// Custom components
import { HorizonLogo } from "components/icons/Icons";
import { HSeparator } from "components/separator/Separator";

export function SidebarBrand() {
  //   Chakra color mode
  let logoColor = useColorModeValue("navy.700", "white");

  return (
    <>
          <Flex align='center' direction='row' p={5}>
      {/* <HorizonLogo h='26px' w='175px' my='32px' color={logoColor} /> */}
      <Image h='1.75rem' w='1.75rem'  src={logo} alt='rezofin' />
      <Text fontWeight='bold' fontSize='xx-large' >
        Rezofin
      </Text>
    </Flex>
    <HSeparator mb='20px' />
    </>
  );
}

export default SidebarBrand;
